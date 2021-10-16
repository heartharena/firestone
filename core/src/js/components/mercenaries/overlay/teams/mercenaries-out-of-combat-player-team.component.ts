import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { MemoryMercenariesMap } from '../../../../models/memory/memory-mercenaries-info';
import {
	BattleAbility,
	BattleEquipment,
	BattleMercenary,
	MercenariesBattleTeam,
} from '../../../../models/mercenaries/mercenaries-battle-state';
import { Preferences } from '../../../../models/preferences';
import { CardsFacadeService } from '../../../../services/cards-facade.service';
import { MercenariesReferenceData } from '../../../../services/mercenaries/mercenaries-state-builder.service';
import { getHeroRole } from '../../../../services/mercenaries/mercenaries-utils';
import { PreferencesService } from '../../../../services/preferences.service';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';
import { arraysEqual } from '../../../../services/utils';

@Component({
	selector: 'mercenaries-out-of-combat-player-team',
	styleUrls: [],
	template: ` <mercenaries-team-root
		[team]="team$ | async"
		[side]="'out-of-combat-player'"
		[trackerPositionUpdater]="trackerPositionUpdater"
		[trackerPositionExtractor]="trackerPositionExtractor"
		[defaultTrackerPositionLeftProvider]="defaultTrackerPositionLeftProvider"
		[defaultTrackerPositionTopProvider]="defaultTrackerPositionTopProvider"
	></mercenaries-team-root>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesOutOfCombatPlayerTeamComponent {
	trackerPositionUpdater = (left: number, top: number) => this.prefs.updateMercenariesTeamPlayerPosition(left, top);
	trackerPositionExtractor = (prefs: Preferences) => prefs.mercenariesPlayerTeamOverlayPosition;
	defaultTrackerPositionLeftProvider = (gameWidth: number, windowWidth: number) => gameWidth - windowWidth / 2 - 180;
	defaultTrackerPositionTopProvider = (gameHeight: number, windowHeight: number) => 10;
	team$: Observable<MercenariesBattleTeam>;

	constructor(
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
	) {
		this.team$ = combineLatest(
			this.store.listenMercenariesOutOfCombat$(([state, prefs]) => state),
			this.store.listen$(([main, nav, prefs]) => main.mercenaries?.referenceData),
		).pipe(
			debounceTime(50),
			filter(
				([[state], [referenceData]]) =>
					!!referenceData && !!state?.mercenariesMemoryInfo?.Map?.PlayerTeam?.length,
			),
			map(
				([[state], [referenceData]]) =>
					[state.mercenariesMemoryInfo.Map, referenceData] as [
						MemoryMercenariesMap,
						MercenariesReferenceData,
					],
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([mapInfo, referenceData]) =>
				MercenariesBattleTeam.create({
					mercenaries: mapInfo?.PlayerTeam.map((playerTeamInfo) => {
						const refMerc = referenceData.mercenaries.find((merc) => merc.id === playerTeamInfo.Id);
						const mercCard = this.allCards.getCardFromDbfId(refMerc.cardDbfId);
						return BattleMercenary.create({
							cardId: mercCard.id,
							role: getHeroRole(mercCard.mercenaryRole),
							level: playerTeamInfo.Level,
							isDead: (mapInfo.DeadMercIds ?? []).includes(playerTeamInfo.Id),
							abilities: [
								...playerTeamInfo.Abilities.map((ability) => {
									return BattleAbility.create({
										cardId: ability.CardId,
									});
								}),
								...(playerTeamInfo.TreasureCardDbfIds ?? []).map((treasureDbfId) => {
									return BattleAbility.create({
										cardId: this.allCards.getCardFromDbfId(treasureDbfId).id,
										isTreasure: true,
									});
								}),
							],
							equipment: (playerTeamInfo.Equipments ?? [])
								.filter((equip) => equip.Equipped)
								.map((equip) => {
									const refEquipment = refMerc.equipments?.find((e) => e.equipmentId === equip.Id);
									return BattleEquipment.create({
										cardId: this.allCards.getCardFromDbfId(refEquipment?.cardDbfId)?.id,
										level: equip.Tier,
									});
								})
								.pop(),
						});
					}),
				}),
			),
			filter((team) => !!team),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((filter) => cdLog('emitting team in ', this.constructor.name, filter)),
		);
	}
}