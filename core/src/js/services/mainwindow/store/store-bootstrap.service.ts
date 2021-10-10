import { EventEmitter, Injectable } from '@angular/core';
import { ArenaState } from '../../../models/arena/arena-state';
import { DuelsState } from '../../../models/duels/duels-state';
import { AchievementsState } from '../../../models/mainwindow/achievements-state';
import { DecktrackerState } from '../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { ReplaysState } from '../../../models/mainwindow/replays/replays-state';
import { SocialShareUserInfo } from '../../../models/mainwindow/social-share-user-info';
import { MercenariesState } from '../../../models/mercenaries/mercenaries-state';
import { FORCE_LOCAL_PROP, Preferences } from '../../../models/preferences';
import { AchievementsRepository } from '../../achievement/achievements-repository.service';
import { ArenaStateBuilderService } from '../../arena/arena-state-builder.service';
import { BgsBestUserStatsService } from '../../battlegrounds/bgs-best-user-stats.service';
import { BgsGlobalStatsService } from '../../battlegrounds/bgs-global-stats.service';
import { BgsInitService } from '../../battlegrounds/bgs-init.service';
import { CardsInitService } from '../../cards-init.service';
import { ArenaRunParserService } from '../../decktracker/arena-run-parser.service';
import { DungeonLootParserService } from '../../decktracker/dungeon-loot-parser.service';
import { DecktrackerStateLoaderService } from '../../decktracker/main/decktracker-state-loader.service';
import { ReplaysStateBuilderService } from '../../decktracker/main/replays-state-builder.service';
import { DuelsStateBuilderService } from '../../duels/duels-state-builder.service';
import { GlobalStatsService } from '../../global-stats/global-stats.service';
import { MercenariesStateBuilderService } from '../../mercenaries/mercenaries-state-builder.service';
import { OverwolfService } from '../../overwolf.service';
import { PatchesConfigService } from '../../patches-config.service';
import { PreferencesService } from '../../preferences.service';
import { GameStatsLoaderService } from '../../stats/game/game-stats-loader.service';
import { StatsStateBuilderService } from '../../stats/stats-state-builder.service';
import { UserService } from '../../user.service';
import { CollectionBootstrapService } from './collection-bootstrap.service';
import { MainWindowStoreEvent } from './events/main-window-store-event';
import { StoreInitEvent } from './events/store-init-event';
import { AchievementUpdateHelper } from './helper/achievement-update-helper';

@Injectable()
export class StoreBootstrapService {
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly cardsInit: CardsInitService,
		private readonly achievementsRepository: AchievementsRepository,
		private readonly achievementsHelper: AchievementUpdateHelper,
		private readonly ow: OverwolfService,
		private readonly userService: UserService,
		private readonly prefs: PreferencesService,
		private readonly gameStatsLoader: GameStatsLoaderService,
		private readonly bgsInit: BgsInitService,
		private readonly bgsGlobalStats: BgsGlobalStatsService,
		private readonly replaysStateBuilder: ReplaysStateBuilderService,
		private readonly decktrackerStateLoader: DecktrackerStateLoaderService,
		private readonly globalStats: GlobalStatsService,
		private readonly bestBgsStats: BgsBestUserStatsService,
		private readonly collectionBootstrap: CollectionBootstrapService,
		private readonly patchConfig: PatchesConfigService,
		private readonly duels: DuelsStateBuilderService,
		private readonly arena: ArenaStateBuilderService,
		private readonly dungeonLoot: DungeonLootParserService,
		private readonly arenaService: ArenaRunParserService,
		private readonly stats: StatsStateBuilderService,
		private readonly mercenariesService: MercenariesStateBuilderService,
	) {
		setTimeout(() => {
			this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
		});
	}

	public async initStore() {
		// First load for the FTUE
		const prefs = await this.prefs.getPreferences();
		const showFtue = !prefs.ftue.hasSeenGlobalFtue;
		// Early init to avoid having the navigation jump when restoring the app to the previous tab
		const windowStateForFtue = Object.assign(new MainWindowState(), {
			showFtue: showFtue,
		} as MainWindowState);
		this.stateUpdater.next(new StoreInitEvent(windowStateForFtue, false));

		// Load all the initial data
		const [
			[
				socialShareUserInfo,
				currentUser,
				achievementTopCategories,
				achievementHistory,
				globalStats,
				collectionState,
				prefsFromRemote,
			],
			[bgsBestUserStats, bgsPerfectGames],
			[matchStats, archetypesConfig, archetypesStats],
			[[duelsRunInfo, duelsRewardsInfo], duelsGlobalStats, duelsLeaderboard],
			[arenaRewards],
			[mercenariesGlobalStats, mercenariesReferenceData],
		] = await Promise.all([
			Promise.all([
				this.initializeSocialShareUserInfo(),
				this.userService.getCurrentUser(),
				this.achievementsRepository.getTopLevelCategories(),
				this.achievementsHelper.buildAchievementHistory(),
				this.globalStats.getGlobalStats(),
				this.collectionBootstrap.initCollectionState(),
				this.prefs.loadRemotePrefs(),
			]),
			Promise.all([this.bestBgsStats.getBgsBestUserStats(), this.bgsInit.loadPerfectGames()]),
			Promise.all([
				this.gameStatsLoader.retrieveStats(),
				this.gameStatsLoader.retrieveArchetypesConfig(),
				this.gameStatsLoader.retrieveArchetypesStats(),
			]),
			Promise.all([this.duels.loadRuns(), this.duels.loadGlobalStats(), this.duels.loadLeaderboard()]),
			Promise.all([this.arena.loadRewards()]),
			Promise.all([this.mercenariesService.loadGlobalStats(), this.mercenariesService.loadReferenceData()]),
		]);
		console.log('loaded info');

		console.debug('remote prefs', prefsFromRemote);
		const mergedPrefs = this.mergePrefs(prefs, prefsFromRemote);

		const bgsGlobalStats = await this.bgsGlobalStats.loadGlobalStats(mergedPrefs.bgsActiveTribesFilter);

		const patchConfig = await this.patchConfig.getConf();
		const currentBattlegroundsMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentBattlegroundsMetaPatch)
			: null;
		const battlegroundsAppState = await this.bgsInit.initBattlegoundsAppState(
			bgsGlobalStats,
			bgsPerfectGames,
			currentBattlegroundsMetaPatch,
		);

		const newStatsState = this.stats.initState(
			prefs,
			matchStats,
			archetypesConfig,
			archetypesStats,
			bgsBestUserStats,
		);
		const currentRankedMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentConstructedMetaPatch)
			: null;
		const decktracker = this.decktrackerStateLoader.buildState(
			new DecktrackerState(),
			newStatsState,
			currentRankedMetaPatch,
			mergedPrefs,
		);
		const replayState: ReplaysState = await this.replaysStateBuilder.buildState(
			new ReplaysState(),
			newStatsState,
			decktracker.decks,
		);

		// Update prefs to remove hidden deck codes that are not in an active deck anymore
		const allDeckCodes = newStatsState.gameStats.stats.map((match) => match.playerDecklist);
		const validHiddenCodes = mergedPrefs.desktopDeckHiddenDeckCodes.filter((deckCode) =>
			allDeckCodes.includes(deckCode),
		);
		await this.prefs.setDesktopDeckHiddenDeckCodes(validHiddenCodes);

		const newAchievementState = Object.assign(new AchievementsState(), {
			categories: achievementTopCategories,
			achievementHistory: achievementHistory,
			isLoading: false,
		} as AchievementsState);

		this.dungeonLoot.setLastDuelsMatch(
			newStatsState.gameStats?.stats?.filter(
				(stat) => stat.gameMode === 'duels' || stat.gameMode === 'paid-duels',
			),
		);
		this.arenaService.setLastArenaMatch(
			newStatsState.gameStats?.stats?.filter((stat) => stat.gameMode === 'arena'),
		);

		const currentDuelsMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentDuelsMetaPatch)
			: null;
		const duelsStats: DuelsState = this.duels.initState(
			duelsGlobalStats,
			duelsRunInfo,
			duelsRewardsInfo,
			duelsLeaderboard,
			collectionState,
		);
		const newDuelsState = await this.duels.updateState(
			duelsStats,
			matchStats,
			duelsStats?.currentDuelsMetaPatch || currentDuelsMetaPatch,
		);

		const currentArenaMetaPatch = patchConfig?.patches
			? patchConfig.patches.find((patch) => patch.number === patchConfig.currentArenaMetaPatch)
			: null;
		const arenaState: ArenaState = await this.arena.initState(currentArenaMetaPatch, arenaRewards);

		const mercenariesState: MercenariesState = await this.mercenariesService.initState(
			mercenariesGlobalStats,
			mercenariesReferenceData,
		);

		const initialWindowState = Object.assign(new MainWindowState(), {
			currentUser: currentUser,
			showFtue: !mergedPrefs.ftue.hasSeenGlobalFtue,
			replays: replayState,
			binder: collectionState,
			achievements: newAchievementState,
			decktracker: decktracker,
			battlegrounds: battlegroundsAppState,
			duels: newDuelsState,
			arena: arenaState,
			mercenaries: mercenariesState,
			socialShareUserInfo: socialShareUserInfo,
			stats: newStatsState,
			globalStats: globalStats,
		} as MainWindowState);
		this.stateUpdater.next(new StoreInitEvent(initialWindowState, true));
	}

	private mergePrefs(prefs: Preferences, prefsFromRemote: Preferences): Preferences {
		if (
			prefs?.lastUpdateDate &&
			(!prefsFromRemote?.lastUpdateDate ||
				// Can happen if the remote prefs was not updated when closing the app
				prefsFromRemote.lastUpdateDate.getTime() < prefs.lastUpdateDate.getTime())
		) {
			console.warn(
				'not using remote prefs, they are older than local prefs',
				prefsFromRemote?.lastUpdateDate,
				prefs?.lastUpdateDate,
			);
			this.prefs.updateRemotePreferences();
			return prefs;
		}

		const merged: Preferences = {
			...(prefsFromRemote ?? prefs),
		} as Preferences;

		const obj = new Preferences();
		for (const prop in merged) {
			const meta = Reflect.getMetadata(FORCE_LOCAL_PROP, obj, prop);
			if (meta && obj.hasOwnProperty(prop)) {
				merged[prop] = prefs[prop];
			}
		}
		console.debug('merged', merged);
		return merged;
	}

	private async initializeSocialShareUserInfo(): Promise<SocialShareUserInfo> {
		const twitter = await this.ow.getTwitterUserInfo();
		return Object.assign(new SocialShareUserInfo(), {
			twitter: twitter,
		} as SocialShareUserInfo);
	}
}
