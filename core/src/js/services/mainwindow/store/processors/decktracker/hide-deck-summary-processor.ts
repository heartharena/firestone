import { DecktrackerState } from '../../../../../models/mainwindow/decktracker/decktracker-state';
import { MainWindowState } from '../../../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../../../models/mainwindow/navigation/navigation-state';
import { DecksStateBuilderService } from '../../../../decktracker/main/decks-state-builder.service';
import { PreferencesService } from '../../../../preferences.service';
import { HideDeckSummaryEvent } from '../../events/decktracker/hide-deck-summary-event';
import { Processor } from '../processor';

export class HideDeckSummaryProcessor implements Processor {
	constructor(
		private readonly decksStateBuilder: DecksStateBuilderService,
		private readonly prefs: PreferencesService,
	) {}

	public async process(
		event: HideDeckSummaryEvent,
		currentState: MainWindowState,
		stateHistory,
		navigationState: NavigationState,
	): Promise<[MainWindowState, NavigationState]> {
		const currentPrefs = await this.prefs.getPreferences();
		const newHiddenDecks = [...currentPrefs.desktopDeckHiddenDeckCodes, event.deckstring];
		const newPrefs = await this.prefs.setDesktopDeckHiddenDeckCodes(newHiddenDecks);
		const newState: DecktrackerState = Object.assign(new DecktrackerState(), currentState.decktracker, {
			decks: this.decksStateBuilder.buildState(currentState.stats, currentState.decktracker.filters, newPrefs),
		} as DecktrackerState);
		return [
			Object.assign(new MainWindowState(), currentState, {
				decktracker: newState,
			} as MainWindowState),
			null,
		];
	}
}