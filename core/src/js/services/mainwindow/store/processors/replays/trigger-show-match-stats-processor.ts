import { BgsPostMatchStatsPanel } from '../../../../../models/battlegrounds/post-match/bgs-post-match-stats-panel';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationReplays } from '../../../../../models/mainwindow/navigation/navigation-replays';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { MatchDetail } from '../../../../../models/mainwindow/replays/match-detail';
import { BgsRunStatsService } from '../../../../battlegrounds/bgs-run-stats.service';
import { TriggerShowMatchStatsEvent } from '../../events/replays/trigger-show-match-stats-event';
import { Processor } from '../processor';

export class TriggerShowMatchStatsProcessor implements Processor {
	constructor(private readonly bgsRunStats: BgsRunStatsService) {}

	public async process(
		event: TriggerShowMatchStatsEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		this.bgsRunStats.retrieveReviewPostMatchStats(event.reviewId);
		const selectedInfo = currentState.replays.allReplays.find(replay => replay.reviewId === event.reviewId);
		const matchDetail = Object.assign(new MatchDetail(), {
			replayInfo: selectedInfo,
			bgsPostMatchStatsPanel: BgsPostMatchStatsPanel.create({
				stats: null,
				globalStats: currentState.battlegrounds.globalStats,
				player: null,
				isComputing: true,
				selectedStat: null, // We use the navigation-level info, to avoid
				tabs: ['hp-by-turn', 'winrate-per-turn', 'warband-total-stats-by-turn'], //, 'warband-composition-by-turn'], <-- will be reintroduced later
			} as BgsPostMatchStatsPanel),
		} as MatchDetail);
		const newReplays = navigationState.navigationReplays.update({
			currentView: 'match-details',
			selectedTab: 'match-stats',
			selectedReplay: matchDetail,
		} as NavigationReplays);
		return [
			null,
			navigationState.update({
				isVisible: true,
				currentApp: 'replays',
				navigationReplays: newReplays,
				text: new Date(selectedInfo.creationTimestamp).toLocaleDateString('en-US', {
					month: 'short',
					day: '2-digit',
					year: 'numeric',
				}),
				image: null,
			} as NavigationState),
		];
	}
}