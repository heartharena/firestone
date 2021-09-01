import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, ViewRef } from '@angular/core';
import { FormControl } from '@angular/forms';
import { CardIds, GameTag, ReferenceCard } from '@firestone-hs/reference-data';
import { Entity, EntityAsJS } from '@firestone-hs/replay-parser';
import { BoardEntity } from '@firestone-hs/simulate-bgs-battle/dist/board-entity';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import { getEffectiveTribe } from '../../../services/battlegrounds/bgs-utils';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { AppUiStoreService } from '../../../services/ui-store/app-ui-store.service';
import { arraysEqual, sortByProperties } from '../../../services/utils';

@Component({
	selector: 'bgs-simulator-minion-selection',
	styleUrls: [
		`../../../../css/global/scrollbar.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/battlegrounds/battles/bgs-simulator-minion-selection.component.scss`,
	],
	template: `
		<div class="container">
			<button class="i-30 close-button" (mousedown)="close()">
				<svg class="svg-icon-fill">
					<use
						xmlns:xlink="https://www.w3.org/1999/xlink"
						xlink:href="assets/svg/sprite.svg#window-control_close"
					></use>
				</svg>
			</button>

			<div class="title">Update Minion</div>
			<div class="current-hero">
				<div *ngIf="card" class="hero-portrait-frame">
					<bgs-card-tooltip [config]="card" [visible]="true"></bgs-card-tooltip>
				</div>
				<div *ngIf="!card" class="hero-portrait-frame empty">
					<div class="empty-hero" inlineSVG="assets/svg/bg_empty_minion_full.svg"></div>
				</div>
				<div class="abilities" [ngClass]="{ 'disabled': !card }">
					<div class="stats">
						<div class="input attack">
							<div class="label">Attack</div>
							<input
								type="number"
								[ngModel]="attack"
								(ngModelChange)="onAttackChanged($event)"
								(mousedown)="preventDrag($event)"
							/>
							<div class="buttons">
								<button
									class="arrow up"
									inlineSVG="assets/svg/arrow.svg"
									(click)="incrementAttack()"
								></button>
								<button
									class="arrow down"
									inlineSVG="assets/svg/arrow.svg"
									(click)="decrementAttack()"
								></button>
							</div>
						</div>
						<div class="input health">
							<div class="label">Health</div>
							<input
								type="number"
								[ngModel]="health"
								(ngModelChange)="onHealthChanged($event)"
								(mousedown)="preventDrag($event)"
							/>
							<div class="buttons">
								<button
									class="arrow up"
									inlineSVG="assets/svg/arrow.svg"
									(click)="incrementHealth()"
								></button>
								<button
									class="arrow down"
									inlineSVG="assets/svg/arrow.svg"
									(click)="decrementHealth()"
								></button>
							</div>
						</div>
					</div>
					<div class="attributes">
						<checkbox
							[label]="'Premium'"
							[value]="premium"
							(valueChanged)="onPremiumChanged($event)"
						></checkbox>
						<checkbox
							[label]="'Divine Shield'"
							[value]="divineShield"
							(valueChanged)="onDivineShieldChanged($event)"
						></checkbox>
						<checkbox
							[label]="'Poisonous'"
							[value]="poisonous"
							(valueChanged)="onPoisonousChanged($event)"
						></checkbox>
						<checkbox
							[label]="'Reborn'"
							[value]="reborn"
							(valueChanged)="onRebornChanged($event)"
						></checkbox>
						<checkbox [label]="'Taunt'" [value]="taunt" (valueChanged)="onTauntChanged($event)"></checkbox>
						<checkbox
							[label]="'Windfury'"
							[value]="windfury"
							(valueChanged)="onWindfuryChanged($event)"
						></checkbox>
						<checkbox
							[label]="'Mega Windfury'"
							[value]="megaWindfury"
							(valueChanged)="onMegaWindfuryChanged($event)"
						></checkbox>
						<checkbox
							[label]="'Summon Mechs'"
							[value]="summonMechs"
							(valueChanged)="onSummonMechsChanged($event)"
							helpTooltip='Gives the minion "Deathrattle: summon two 1/1 mechs"'
						></checkbox>
						<checkbox
							[label]="'Summon Plants'"
							[value]="summonPlants"
							(valueChanged)="onSummonPlantsChanged($event)"
							helpTooltip='Gives the minion "Deathrattle: summon two 1/1 plants"'
						></checkbox>
					</div>
				</div>
			</div>
			<div class="hero-selection">
				<div class="header">Minions</div>
				<div class="search">
					<bgs-sim-minion-tribe-filter class="filter tribe-filter"></bgs-sim-minion-tribe-filter>
					<bgs-sim-minion-tier-filter class="filter tier-filter"></bgs-sim-minion-tier-filter>
					<label class="search-label" [ngClass]="{ 'search-active': !!searchString.value?.length }">
						<div class="icon" inlineSVG="assets/svg/search.svg"></div>
						<input
							[formControl]="searchForm"
							(mousedown)="preventDrag($event)"
							placeholder="Search Minion"
						/>
					</label>
				</div>
				<div class="heroes" scrollable>
					<div
						*ngFor="let minion of allMinions$ | async"
						class="hero-portrait-frame"
						[ngClass]="{ 'selected': minion.id === _currentMinion?.id }"
						(click)="selectMinion(minion)"
					>
						<img class="icon" [src]="minion.icon" />
					</div>
				</div>
			</div>
			<div class="controls">
				<div class="button" (click)="validate()" [ngClass]="{ 'disabled': !card }">Select</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsSimulatorMinionSelectionComponent implements OnDestroy {
	@Input() closeHandler: () => void;
	@Input() applyHandler: (newEntity: BoardEntity) => void;
	@Input() entityId: number;

	@Input() set currentMinion(value: BoardEntity) {
		this._entity = value;
		console.debug('set', this._entity);
		this.updateValues();
	}

	searchForm = new FormControl();

	card: Entity;

	allMinions$: Observable<readonly Minion[]>;

	cardId: string;
	premium: boolean;
	divineShield: boolean;
	poisonous: boolean;
	reborn: boolean;
	taunt: boolean;
	attack: number;
	health: number;
	windfury: boolean;
	megaWindfury: boolean;
	summonMechs: boolean;
	summonPlants: boolean;

	searchString = new BehaviorSubject<string>(null);

	private ref: ReferenceCard;
	private _entity: BoardEntity;
	private subscription: Subscription;

	constructor(
		private readonly allCards: CardsFacadeService,
		private readonly store: AppUiStoreService,
		private readonly cdr: ChangeDetectorRef,
	) {
		// console.debug('init', this.store, store, allCards, this.allCards);
		this.allMinions$ = combineLatest(
			this.searchString.asObservable(),
			this.store.listen$(
				([main, nav, prefs]) => prefs.bgsActiveSimulatorMinionTribeFilter,
				([main, nav, prefs]) => prefs.bgsActiveSimulatorMinionTierFilter,
			),
		).pipe(
			debounceTime(200),
			map(([searchString, [tribeFilter, tierFilter]]) => [searchString, tribeFilter, tierFilter]),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(([searchString, tribeFilter, tierFilter]) =>
				this.allCards
					.getCards()
					.filter(
						(card) =>
							(card.battlegroundsPremiumDbfId && card.techLevel) || TOKEN_CARD_IDS.includes(card.id),
					)
					.filter(
						(card) =>
							!tribeFilter ||
							tribeFilter === 'all' ||
							getEffectiveTribe(card, true).toLowerCase() === tribeFilter,
					)
					.filter((card) => !tierFilter || tierFilter === 'all' || card.techLevel === +tierFilter)
					.filter(
						(card) =>
							!searchString?.length ||
							card.name.toLowerCase().includes(searchString.toLowerCase()) ||
							card.text?.toLowerCase().includes(searchString.toLowerCase()),
					)
					.map((card) => ({
						id: card.id,
						icon: `https://static.zerotoheroes.com/hearthstone/fullcard/en/compressed/battlegrounds/${card.id}_bgs.png`,
						name: card.name,
						tier: card.techLevel ?? 0,
					}))
					.sort(sortByProperties((minion: Minion) => [minion.tier, minion.name])),
			),
			startWith([]),
			// FIXME
			tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
			tap((heroes) => console.debug('minions', heroes)),
		);
		this.subscription = this.searchForm.valueChanges
			.pipe(debounceTime(200))
			.pipe(distinctUntilChanged())
			.subscribe((data) => {
				// console.log('value changed?', data);
				this.searchString.next(data);
			});
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

	onPremiumChanged(value: boolean) {
		this.premium = value;
		if (value) {
			this.cardId = this.ref.battlegroundsNormalDbfId
				? this.ref.id
				: this.allCards.getCardFromDbfId(this.ref.battlegroundsPremiumDbfId).id;
		} else {
			this.cardId = this.ref.battlegroundsNormalDbfId
				? this.allCards.getCardFromDbfId(this.ref.battlegroundsNormalDbfId).id
				: this.cardId;
		}
		this.ref = this.allCards.getCard(this.cardId);
		this.attack = this.ref.attack;
		this.health = this.ref.health;
		this.divineShield = this.ref.mechanics?.includes(GameTag[GameTag.DIVINE_SHIELD]);
		this.poisonous = this.ref.mechanics?.includes(GameTag[GameTag.POISONOUS]);
		this.taunt = this.ref.mechanics?.includes(GameTag[GameTag.TAUNT]);
		this.windfury = this.ref.mechanics?.includes(GameTag[GameTag.WINDFURY]);
		this.megaWindfury = this.ref.mechanics?.includes(GameTag[GameTag.MEGA_WINDFURY]);
		this.updateCard();
	}

	onDivineShieldChanged(value: boolean) {
		this.divineShield = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onWindfuryChanged(value: boolean) {
		this.windfury = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMegaWindfuryChanged(value: boolean) {
		this.megaWindfury = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSummonMechsChanged(value: boolean) {
		this.summonMechs = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onSummonPlantsChanged(value: boolean) {
		this.summonPlants = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onPoisonousChanged(value: boolean) {
		this.poisonous = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onRebornChanged(value: boolean) {
		this.reborn = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onTauntChanged(value: boolean) {
		this.taunt = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	incrementAttack() {
		this.attack++;
		this.updateCard();
	}

	decrementAttack() {
		if (this.attack <= 0) {
			return;
		}
		this.attack--;
		this.updateCard();
	}

	incrementHealth() {
		this.health++;
		this.updateCard();
	}

	decrementHealth() {
		if (this.health <= 1) {
			return;
		}
		this.health--;
		this.updateCard();
	}

	onAttackChanged(value: number) {
		this.attack = value;
		this.updateCard();
	}

	onHealthChanged(value: number) {
		this.health = value;
		this.updateCard();
	}

	selectMinion(minion: Minion) {
		console.debug('selected minion', minion);
		this.cardId = minion.id;
		this.ref = this.allCards.getCard(this.cardId);
		this.premium = this.ref.battlegroundsNormalDbfId > 0;
		this.attack = this.ref.attack;
		this.health = this.ref.health;
		this.divineShield = this.ref.mechanics?.includes(GameTag[GameTag.DIVINE_SHIELD]);
		this.poisonous = this.ref.mechanics?.includes(GameTag[GameTag.POISONOUS]);
		this.taunt = this.ref.mechanics?.includes(GameTag[GameTag.TAUNT]);
		this.windfury = this.ref.mechanics?.includes(GameTag[GameTag.WINDFURY]);
		this.megaWindfury = this.ref.mechanics?.includes(GameTag[GameTag.MEGA_WINDFURY]);
		this.updateCard();
	}

	close() {
		this.closeHandler();
	}

	validate() {
		console.debug('selecting minion');
		this.applyHandler({
			entityId: this.entityId,
			cardId: this.cardId,
			attack: this.attack,
			health: this.health,
			divineShield: this.divineShield,
			poisonous: this.poisonous,
			taunt: this.taunt,
			reborn: this.reborn,
			windfury: this.windfury,
			megaWindfury: this.megaWindfury,
			enchantments: [
				this.summonMechs
					? { cardId: CardIds.NonCollectible.Neutral.ReplicatingMenace_ReplicatingMenaceEnchantment }
					: null,
				this.summonPlants
					? { cardId: CardIds.NonCollectible.Neutral.LivingSpores_LivingSporesEnchantment }
					: null,
			].filter((e) => !!e),
		} as BoardEntity);
	}

	preventDrag(event: MouseEvent) {
		event.stopPropagation();
	}

	private async updateValues() {
		if (!this._entity) {
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			return;
		}

		this.cardId = this._entity.cardId;
		this.ref = this.allCards.getCard(this.cardId);
		this.premium = this.ref.battlegroundsNormalDbfId > 0;
		this.attack = this._entity.attack;
		this.health = this._entity.health;
		this.divineShield = this._entity.divineShield;
		this.poisonous = this._entity.poisonous;
		this.reborn = this._entity.reborn;
		this.taunt = this._entity.taunt;
		this.windfury = this._entity.windfury;
		this.megaWindfury = this._entity.megaWindfury;
		this.summonMechs = this._entity.enchantments
			.map((e) => e.cardId)
			.includes(CardIds.NonCollectible.Neutral.ReplicatingMenace_ReplicatingMenaceEnchantment);
		this.summonPlants = this._entity.enchantments
			.map((e) => e.cardId)
			.includes(CardIds.NonCollectible.Neutral.LivingSpores_LivingSporesEnchantment);
		this.updateCard();
	}

	private updateCard() {
		this.card = Entity.fromJS({
			cardID: this.cardId,
			tags: {
				[GameTag[GameTag.ATK]]: this.attack ?? 0,
				[GameTag[GameTag.HEALTH]]: this.health ?? 0,
				[GameTag[GameTag.PREMIUM]]: this.premium ? 1 : 0,
			},
		} as EntityAsJS);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface Minion {
	id: string;
	icon: string;
	name: string;
	tier: number;
}

const TOKEN_CARD_IDS = [
	CardIds.NonCollectible.Neutral.AvatarOfNzoth_FishOfNzothTokenBattlegrounds,
	CardIds.NonCollectible.Neutral.Menagerist_AmalgamTokenBattlegrounds,
];