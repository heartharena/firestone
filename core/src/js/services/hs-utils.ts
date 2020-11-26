import { CardIds } from '@firestone-hs/reference-data';
import { capitalizeEachWord } from './utils';

export const classes = [
	'demonhunter',
	'druid',
	'hunter',
	'mage',
	'paladin',
	'priest',
	'rogue',
	'shaman',
	'warrior',
	'warlock',
];

export const formatClass = (playerClass: string): string => {
	let update = playerClass?.toLowerCase();
	if (playerClass === 'demonhunter') {
		update = 'demon hunter';
	}
	return capitalizeEachWord(update);
};

export const globalEffectCards = [
	CardIds.Collectible.Druid.Embiggen,
	CardIds.Collectible.Druid.SurvivalOfTheFittest,
	CardIds.Collectible.Hunter.ShandoWildclaw, // TODO: only show the effect if the "beast in your deck +1/+1 option, is chosen"
	CardIds.Collectible.Mage.DeckOfLunacy,
	CardIds.Collectible.Mage.LunasPocketGalaxy,
	CardIds.Collectible.Mage.IncantersFlow,
	CardIds.NonCollectible.Mage.InfiniteArcane,
	// CardIds.Collectible.Neutral.BakuTheMooneater,
	CardIds.Collectible.Neutral.FrizzKindleroost,
	CardIds.Collectible.Neutral.LorekeeperPolkelt,
	// CardIds.Collectible.Neutral.GennGreymane,
	CardIds.Collectible.Neutral.PrinceKeleseth,
	CardIds.Collectible.Neutral.WyrmrestPurifier,
	CardIds.Collectible.Paladin.AldorAttendant,
	CardIds.Collectible.Paladin.AldorTruthseeker,
	CardIds.Collectible.Paladin.LothraxionTheRedeemed,
	CardIds.Collectible.Priest.ArchbishopBenedictus,
	CardIds.Collectible.Priest.LadyInWhite,
	CardIds.Collectible.Shaman.GrandTotemEysor, // TODO: count the number of times the effect triggered, not the card played
	CardIds.Collectible.Warlock.DarkPharaohTekahn,
	CardIds.Collectible.Warlock.DeckOfChaos,
	CardIds.Collectible.Warlock.RenounceDarkness,
	CardIds.NonCollectible.Neutral.ReductomaraToken,
	CardIds.NonCollectible.Neutral.UpgradedPackMule,
	CardIds.NonCollectible.Paladin.LordaeronAttendant,
	CardIds.NonCollectible.Rogue.TheCavernsBelow_CrystalCoreTokenUNGORO,
];

export const forcedHiddenCardCreators = [
	CardIds.NonCollectible.Neutral.MaskOfMimicryLOOTAPALOOZA,
	CardIds.NonCollectible.Neutral.MaskOfMimicryTavernBrawl,
];

export const publicCardCreators = [
	CardIds.Collectible.Druid.FungalFortunes, // tested
	CardIds.Collectible.Druid.JuicyPsychmelon, // tested
	CardIds.Collectible.Druid.LunarVisions, // tested
	CardIds.Collectible.Druid.PredatoryInstincts, // tested
	CardIds.Collectible.Druid.GuessTheWeight,
	CardIds.Collectible.Hunter.ArcaneFletcher, // tested
	CardIds.Collectible.Hunter.CallPet, // tested
	CardIds.Collectible.Hunter.DivingGryphon, // tested
	CardIds.Collectible.Hunter.KingsElekk,
	CardIds.Collectible.Hunter.MastersCall, // tested
	CardIds.Collectible.Hunter.ScavengersIngenuity, // tested
	CardIds.Collectible.Hunter.TolvirWarden, // tested
	CardIds.Collectible.Hunter.Ursatron, // tested
	CardIds.Collectible.Mage.AncientMysteries, // tested
	CardIds.Collectible.Mage.Arcanologist, // tested
	CardIds.Collectible.Mage.ArchmageArugal, // tested
	CardIds.Collectible.Mage.BookOfSpecters, // tested
	CardIds.Collectible.Mage.ElementalAllies, // tested
	CardIds.Collectible.Mage.RavenFamiliar,
	CardIds.Collectible.Mage.Starscryer, // tested
	CardIds.Collectible.Paladin.CallToAdventure, // tested
	CardIds.Collectible.Paladin.Crystology,
	CardIds.Collectible.Paladin.HowlingCommander,
	CardIds.Collectible.Paladin.PrismaticLens,
	CardIds.Collectible.Paladin.SalhetsPride, // tested
	CardIds.Collectible.Paladin.SmallTimeRecruits,
	CardIds.Collectible.Priest.BwonsamdiTheDead,
	CardIds.Collectible.Priest.DeadRinger,
	CardIds.Collectible.Priest.GhuunTheBloodGod,
	CardIds.NonCollectible.Priest.Insight_InsightToken,
	CardIds.Collectible.Rogue.CavernShinyfinder,
	CardIds.Collectible.Rogue.CursedCastaway,
	CardIds.Collectible.Rogue.ElvenMinstrel,
	CardIds.Collectible.Rogue.GalakrondTheNightmare,
	CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondTheApocalypseToken,
	CardIds.NonCollectible.Rogue.GalakrondtheNightmare_GalakrondAzerothsEndToken,
	CardIds.Collectible.Rogue.GrandEmpressShekzara,
	CardIds.Collectible.Rogue.NecriumApothecary,
	CardIds.Collectible.Rogue.RollTheBones,
	CardIds.Collectible.Rogue.RaidingParty,
	CardIds.Collectible.Rogue.Stowaway,
	CardIds.Collectible.Rogue.Swindle,
	CardIds.Collectible.Shaman.Bogshaper,
	CardIds.Collectible.Shaman.CagematchCustodian,
	CardIds.Collectible.Shaman.ElementaryReaction,
	CardIds.Collectible.Shaman.FarSight,
	CardIds.Collectible.Shaman.IceFishing,
	CardIds.Collectible.Shaman.SpiritOfTheFrog,
	CardIds.Collectible.Shaman.StormChaser,
	CardIds.Collectible.Warlock.FelLordBetrug,
	CardIds.Collectible.Warlock.FreeAdmission,
	CardIds.Collectible.Warlock.SenseDemons,
	CardIds.Collectible.Warrior.AkaliTheRhino,
	CardIds.Collectible.Warrior.Ancharrr,
	CardIds.Collectible.Warrior.CorsairCache,
	CardIds.Collectible.Warrior.ForgeOfSouls,
	CardIds.Collectible.Warrior.GalakrondTheUnbreakable,
	CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondTheApocalypseToken,
	CardIds.NonCollectible.Warrior.GalakrondtheUnbreakable_GalakrondAzerothsEndToken,
	CardIds.Collectible.Warrior.StageDive,
	CardIds.Collectible.Warrior.TownCrier,
	CardIds.Collectible.Warrior.RingmasterWhatley,
	CardIds.Collectible.Warrior.VarianWrynn,
	CardIds.Collectible.Neutral.BrightEyedScout, // tested
	CardIds.Collectible.Neutral.CaptainsParrot,
	CardIds.Collectible.Neutral.ClawMachine,
	CardIds.Collectible.Neutral.CountessAshmore, // tested
	CardIds.Collectible.Neutral.JepettoJoybuzz, // tested
	CardIds.Collectible.Neutral.KronxDragonhoof,
	CardIds.Collectible.Neutral.MurlocTastyfin, // tested
	CardIds.Collectible.Neutral.Sandbinder,
	CardIds.Collectible.Neutral.Subject9, // tested
	CardIds.Collectible.Neutral.TentacledMenace, // tested
	CardIds.Collectible.Neutral.TheCurator, // tested
	CardIds.Collectible.Neutral.UtgardeGrapplesniper, // tested
	CardIds.Collectible.Neutral.WitchwoodPiper, // tested
	CardIds.NonCollectible.Neutral.WondrousWand,
	CardIds.Collectible.Neutral.Wrathion, // tested
];