import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ArenaTimeFilterType } from '../../../../models/arena/arena-time-filter.type';
import { AppUiStoreService } from '../../../../services/app-ui-store.service';
import { ArenaTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/arena/arena-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { formatPatch } from '../../../../services/utils';

/** This approach seems to be the cleanest way to properly narrow down the values needed from
 * the state. The other approaches are cool and data-driven, but as of now they seem more
 * difficult to implement with a store approach. The other filters might have to be refactored
 * to this approach
 */
@Component({
	selector: 'arena-time-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaTimeFilterDropdownComponent implements AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.arena.activeTimeFilter,
				([main, nav]) => main.arena.currentArenaMetaPatch,
				([main, nav]) => nav.navigationArena.selectedCategoryId,
			)
			.pipe(
				filter(([filter, patch, selectedCategoryId]) => !!filter && !!patch && !!selectedCategoryId),
				map(([filter, patch, selectedCategoryId]) => {
					const options: readonly TimeFilterOption[] = [
						{
							value: 'all-time',
							label: 'Past 100 days',
						} as TimeFilterOption,
						{
							value: 'last-patch',
							label: `Last patch`,
							tooltip: formatPatch(patch),
						} as TimeFilterOption,
						{
							value: 'past-seven',
							label: 'Past 7 days',
						} as TimeFilterOption,
						{
							value: 'past-three',
							label: 'Past 3 days',
						} as TimeFilterOption,
					] as readonly TimeFilterOption[];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label ?? 'Past 100 days',
						visible: true,
					};
				}),
				// tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: TimeFilterOption) {
		this.stateUpdater.next(new ArenaTimeFilterSelectedEvent(option.value));
	}
}

interface TimeFilterOption extends IOption {
	value: ArenaTimeFilterType;
}
