import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter } from '@angular/core';
import { IOption } from 'ng-select';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { MmrGroupFilterType } from '../../../../models/mainwindow/battlegrounds/mmr-group-filter-type';
import { AppUiStoreService, cdLog } from '../../../../services/app-ui-store.service';
import { BgsMmrGroupFilterSelectedEvent } from '../../../../services/mainwindow/store/events/battlegrounds/bgs-mmr-group-filter-selected-event';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';

@Component({
	selector: 'battlegrounds-rank-group-dropdown',
	styleUrls: [
		`../../../../../css/global/filters.scss`,
		`../../../../../css/component/app-section.component.scss`,
		`../../../../../css/component/filter-dropdown.component.scss`,
	],
	template: `
		<filter-dropdown
			*ngIf="filter$ | async as value"
			class="battlegrounds-rank-group-dropdown"
			[options]="options"
			[filter]="value.filter"
			[placeholder]="value.placeholder"
			[visible]="value.visible"
			(onOptionSelected)="onSelected($event)"
		></filter-dropdown>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsRankGroupDropdownComponent implements AfterViewInit {
	options: readonly MmrGroupFilterOption[];

	filter$: Observable<{ filter: string; placeholder: string; visible: boolean }>;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly store: AppUiStoreService) {
		this.options = [
			{
				value: 'per-match',
				label: 'Show each match',
			} as MmrGroupFilterOption,
			{
				value: 'per-day',
				label: 'Group per day',
				tooltip: 'Show the rating at the end of each day',
			} as MmrGroupFilterOption,
		] as readonly MmrGroupFilterOption[];
		this.filter$ = this.store
			.listen$(
				([main, nav]) => main.battlegrounds.activeGroupMmrFilter,
				([main, nav]) => nav.navigationBattlegrounds.selectedCategoryId,
			)
			.pipe(
				filter(([filter, selectedCategoryId]) => !!filter && !!selectedCategoryId),
				map(([filter, selectedCategoryId]) => ({
					filter: filter,
					placeholder: this.options.find((option) => option.value === filter)?.label,
					visible: selectedCategoryId === 'bgs-category-personal-rating',
				})),
				tap((filter) => cdLog('emitting filter in ', this.constructor.name, filter)),
			);
	}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	onSelected(option: MmrGroupFilterOption) {
		this.stateUpdater.next(new BgsMmrGroupFilterSelectedEvent(option.value));
	}
}

interface MmrGroupFilterOption extends IOption {
	value: MmrGroupFilterType;
}
