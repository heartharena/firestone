import { Injectable } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { DuelsRewardsInfo } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { ArenaInfo } from '../../models/arena-info';
import { BattlegroundsInfo } from '../../models/battlegrounds-info';
import { Card } from '../../models/card';
import { CardBack } from '../../models/card-back';
import { PackInfo } from '../../models/collection/pack-info';
import { DuelsInfo } from '../../models/duels-info';
import { DeckInfoFromMemory } from '../../models/mainwindow/decktracker/deck-info-from-memory';
import { MatchInfo } from '../../models/match-info';
import { CoinInfo } from '../../models/memory/coin-info';
import { MemoryMercenariesCollectionInfo } from '../../models/memory/memory-mercenaries-collection-info';
import { MemoryMercenariesInfo } from '../../models/memory/memory-mercenaries-info';
import { MemoryUpdate } from '../../models/memory/memory-update';
import { RewardsTrackInfo } from '../../models/rewards-track-info';
import { HsAchievementsInfo } from '../achievement/achievements-info';
import { SetsService } from '../collection/sets-service.service';
import { Events } from '../events.service';
import { OverwolfService } from '../overwolf.service';
import { GetAchievementsInfoOperation } from './mind-vision/get-achievements-info-operation';
import { GetActiveDeckOperation } from './mind-vision/get-active-deck-operation';
import { GetArenaInfoOperation } from './mind-vision/get-arena-info-operation';
import { GetBattlegroundsEndGameOperation } from './mind-vision/get-battlegrounds-end-game-operation';
import { GetBattlegroundsInfoOperation } from './mind-vision/get-battlegrounds-info-operation';
import { GetBattlegroundsMatchOperation } from './mind-vision/get-battlegrounds-match-operation';
import { GetBoostersInfoOperation } from './mind-vision/get-boosters-info-operation';
import { GetCardBacksOperation } from './mind-vision/get-card-backs-operation';
import { GetCoinsOperation } from './mind-vision/get-coins-operation';
import { GetCollectionOperation } from './mind-vision/get-collection-operation';
import { GetCurrentSceneOperation } from './mind-vision/get-current-scene-operation';
import { GetDuelsInfoOperation } from './mind-vision/get-duels-info-operation';
import { GetDuelsRewardsInfoOperation } from './mind-vision/get-duels-rewards-info-operation';
import { GetInGameAchievementsProgressInfoOperation } from './mind-vision/get-in-game-achievements-progress-info-operation';
import { GetMatchInfoOperation } from './mind-vision/get-match-info-operation';
import { GetMemoryChangesOperation } from './mind-vision/get-memory-changes-operation';
import { GetMercenariesCollectionInfoOperation } from './mind-vision/get-mercenaries-collection-info-operation';
import { GetMercenariesInfoOperation } from './mind-vision/get-mercenaries-info-operation';
import { GetRewardsTrackInfoOperation } from './mind-vision/get-rewards-track-info-operation';
import { GetWhizbangDeckOperation } from './mind-vision/get-whizbang-deck-operation';
import { IsMaybeOnDuelsRewardsScreenOperation } from './mind-vision/is-maybe-on-duels-rewards-screen-operation';
import { MindVisionService } from './mind-vision/mind-vision.service';

@Injectable()
export class MemoryInspectionService {
	// https://overwolf.github.io/docs/api/overwolf-games-events-heartstone
	// readonly g_interestedInFeatures = [
	// 	'scene_state', // Used to detect when the UI shows the game
	// 	'match_info', // For the GEP game ID
	// ];

	private getMemoryChangesOperation = new GetMemoryChangesOperation(this.mindVision, this.ow);
	private getCollectionOperation = new GetCollectionOperation(this.mindVision, this.ow, this.cards);
	private getCardBacksOperation = new GetCardBacksOperation(this.mindVision, this.ow, this.cards);
	private getCoinsOperation = new GetCoinsOperation(this.mindVision, this.ow, this.cards);
	private getMatchInfoOperation = new GetMatchInfoOperation(this.mindVision, this.ow);
	private getBattlegroundsInfoOperation = new GetBattlegroundsInfoOperation(this.mindVision, this.ow);
	private getMercenariesInfoOperation = new GetMercenariesInfoOperation(this.mindVision, this.ow);
	private getMercenariesCollectionInfoOperation = new GetMercenariesCollectionInfoOperation(this.mindVision, this.ow);
	private getBattlegroundsEndGameOperation = new GetBattlegroundsEndGameOperation(this.mindVision, this.ow);
	private getBattlegroundsMatchOperation = new GetBattlegroundsMatchOperation(this.mindVision, this.ow);
	private getActiveDeckOperation = new GetActiveDeckOperation(this.mindVision, this.ow);
	private getWhizbangDeckOperation = new GetWhizbangDeckOperation(this.mindVision, this.ow);
	private getArenaInfoOperation = new GetArenaInfoOperation(this.mindVision, this.ow);
	private getDuelsInfoOperation = new GetDuelsInfoOperation(this.mindVision, this.ow);
	private getDuelsRewardsInfoOperation = new GetDuelsRewardsInfoOperation(this.mindVision, this.ow);
	private getRewardsTrackInfoOperation = new GetRewardsTrackInfoOperation(this.mindVision, this.ow);
	private getBoostersInfoOperation = new GetBoostersInfoOperation(this.mindVision, this.ow);
	private getAchievementsInfoOperation = new GetAchievementsInfoOperation(this.mindVision, this.ow);
	private getInGameAchievementsProgressInfoOperation = new GetInGameAchievementsProgressInfoOperation(
		this.mindVision,
		this.ow,
	);
	private getCurrentSceneOperation = new GetCurrentSceneOperation(this.mindVision, this.ow);
	private isMaybeOnDuelsRewardsScreenOperation = new IsMaybeOnDuelsRewardsScreenOperation(this.mindVision, this.ow);

	private listenersRegistered: boolean;

	constructor(
		private events: Events,
		private ow: OverwolfService,
		private mindVision: MindVisionService,
		private cards: SetsService,
	) {
		// this.init();
	}

	public async getMemoryChanges(): Promise<MemoryUpdate> {
		this.debug('getMemoryChanges');
		return this.getMemoryChangesOperation.call();
	}

	public async getCollection(): Promise<readonly Card[]> {
		this.debug('getCollection');
		return this.getCollectionOperation.call();
	}

	public async getCardBacks(): Promise<readonly CardBack[]> {
		this.debug('getCardBacks');
		return this.getCardBacksOperation.call();
	}

	public async getCoins(): Promise<readonly CoinInfo[]> {
		this.debug('getCoins');
		return this.getCoinsOperation.call();
	}

	public async getMatchInfo(): Promise<MatchInfo> {
		this.debug('getMatchInfo');
		return this.getMatchInfoOperation.call();
	}

	public async getBattlegroundsInfo(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		this.debug('getBattlegroundsInfo');
		return this.getBattlegroundsInfoOperation.call(numberOfRetries);
	}

	public async getMercenariesInfo(numberOfRetries?: number): Promise<MemoryMercenariesInfo> {
		this.debug('getMercenariesInfo');
		return this.getMercenariesInfoOperation.call(numberOfRetries);
	}

	public async getMercenariesCollectionInfo(numberOfRetries?: number): Promise<MemoryMercenariesCollectionInfo> {
		this.debug('getMercenariesCollectionInfo');
		return this.getMercenariesCollectionInfoOperation.call(numberOfRetries);
	}

	public async getBattlegroundsEndGame(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		this.debug('getBattlegroundsEndGame');
		return this.getBattlegroundsEndGameOperation.call(numberOfRetries);
	}

	public async getBattlegroundsMatchWithPlayers(numberOfRetries?: number): Promise<BattlegroundsInfo> {
		this.debug('getBattlegroundsMatchWithPlayers');
		return this.getBattlegroundsMatchOperation.call(numberOfRetries);
	}

	public async getActiveDeck(selectedDeckId: number, numberOfRetries: number): Promise<DeckInfoFromMemory> {
		this.debug('getActiveDeck');
		return this.getActiveDeckOperation.call(numberOfRetries, false, selectedDeckId);
	}

	public async getWhizbangDeck(deckId: number): Promise<DeckInfoFromMemory> {
		this.debug('getWhizbangDeck');
		return this.getWhizbangDeckOperation.call(2, false, deckId);
	}

	public async getArenaInfo(): Promise<ArenaInfo> {
		this.debug('getArenaInfo');
		return this.getArenaInfoOperation.call();
	}

	public async getDuelsInfo(forceReset = false, numberOfRetries = 1): Promise<DuelsInfo> {
		this.debug('getDuelsInfo');
		return this.getDuelsInfoOperation.call(numberOfRetries, forceReset);
	}

	public async getDuelsRewardsInfo(forceReset = false): Promise<DuelsRewardsInfo> {
		this.debug('getDuelsRewardsInfo');
		return this.getDuelsRewardsInfoOperation.call(1, forceReset);
	}

	public async getRewardsTrackInfo(): Promise<RewardsTrackInfo> {
		this.debug('getRewardsTrackInfo');
		return this.getRewardsTrackInfoOperation.call();
	}

	public async getAchievementsInfo(forceReset = false, numberOfRetries = 1): Promise<HsAchievementsInfo> {
		this.debug('getAchievementsInfo');
		return this.getAchievementsInfoOperation.call(numberOfRetries, forceReset);
	}

	public async getBoostersInfo(): Promise<readonly PackInfo[]> {
		this.debug('getBoostersInfo');
		return this.getBoostersInfoOperation.call();
	}

	public async getInGameAchievementsProgressInfo(
		forceReset = false,
		numberOfRetries = 2,
	): Promise<HsAchievementsInfo> {
		this.debug('getInGameAchievementsProgressInfo');
		return this.getInGameAchievementsProgressInfoOperation.call(numberOfRetries, forceReset);
	}

	public async getCurrentSceneFromMindVision(): Promise<SceneMode> {
		this.debug('getCurrentSceneFromMindVision');
		return this.getCurrentSceneOperation.call();
	}

	public async isMaybeOnDuelsRewardsScreen(): Promise<boolean> {
		this.debug('isMaybeOnDuelsRewardsScreen');
		return this.isMaybeOnDuelsRewardsScreenOperation.call();
	}

	public async reset(): Promise<void> {
		this.debug('reset');
		await this.mindVision.reset();
	}

	// public async getCurrentScene(): Promise<string> {
	// 	this.debug('getCurrentScene');
	// 	return new Promise<string>(async (resolve) => {
	// 		const gameInfo = await this.ow.getGameEventsInfo();

	// 		resolve(gameInfo?.res?.game_info?.scene_state);
	// 	});
	// }

	private debug(...args) {
		console.debug('[memory-service] calling', ...args, new Error().stack);
	}
}
