import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { BgsActiveTimeFilterType } from '../../../../models/mainwindow/battlegrounds/bgs-active-time-filter.type';
import { AppUiStoreService, cdLog } from '../../../../services/app-ui-store.service';
import { BgsTimeFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-time-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { formatPatch } from '../../../../services/utils';

@Component({
	selector: 'battlegrounds-time-filter-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-time-filter-dropdown"
			[options]="value.options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsTimeFilterDropdownComponent implements AfterViewInit {
	filter$: Observable<{ filter: string; placeholder: string; options: readonly IOption[]; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds.activeTimeFilter,
				([main, nav]) => main.battlegrounds.stats.currentBattlegroundsMetaPatch,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
				([main, nav]) => nav.navigationBattlegrounds.currentView,
			)
			.pipe(
				filter(
					([filter, patch, selectedCategoryId, currentView]) =>
						!!filter && !!patch && !!selectedCategoryId && !!currentView,
				),
				map(([filter, patch, selectedCategoryId, currentView]) => {
					const options: readonly TimeFilterOption[] = [
						{
							value: 'all-time',
							label: 'Past 100 days',
						} as TimeFilterOption,
						{
							value: 'past-30',
							label: 'Past 30 days',
						} as TimeFilterOption,
						{
							value: 'past-7',
							label: 'Past 7 days',
						} as TimeFilterOption,
						{
							value: 'last-patch',
							label: `Last patch`,
							tooltip: formatPatch(patch),
						} as TimeFilterOption,
					];
					return {
						filter: filter,
						options: options,
						placeholder: options.find((option) => option.value === filter)?.label,
						visible:
							!['categories', 'category'].includes(currentView) &&
							![
								'bgs-category-personal-stats',
								'bgs-category-perfect-games',
								'bgs-category-simulator',
							].includes(selectedCategoryId),
					};
				}),
				tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: TimeFilterOption) {
		this.stateUpdater.next(new BgsTimeFilterSelectedEvent(option.value));
	}
}

interface TimeFilterOption extends IOption {
	value: BgsActiveTimeFilterType;
}
