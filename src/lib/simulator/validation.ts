import { ironTotal, manganeseTotal, removalFraction, type Simulation } from './engine';
import { MODULES } from './treatments';
import type { ModuleId, ProblemId, StudyCase, TrainSettings, Water } from './types';
import { PROBLEMS } from './types';

export type OutcomeStatus = 'atteint' | 'partiel' | 'inadequat';

export type Judgement = {
	status: OutcomeStatus;
	title: string;
	lines: string[];
	goals: { label: string; ok: boolean }[];
	gasAlert: boolean;
};

const TITLES: Record<OutcomeStatus, string> = {
	atteint: 'Objectif atteint',
	partiel: 'Amélioration partielle',
	inadequat: 'Traitement inadapté ou objectif non atteint'
};

function statusOf(ok: boolean, partial: boolean): OutcomeStatus {
	if (ok) return 'atteint';
	if (partial) return 'partiel';
	return 'inadequat';
}

function phOk(water: Water): boolean {
	return water.ph >= 6.5 && water.ph <= 9;
}

export function judge(study: StudyCase, simulation: Simulation, settings: TrainSettings): Judgement {
	const before = simulation.before;
	const after = simulation.after;
	const lines: string[] = [];
	let ok = false;
	let partial = false;
	const goals: { label: string; ok: boolean }[] = [];

	if (study.id === 'fer') {
		const total = ironTotal(after);
		ok = total <= 0.2 && after.turbidityNtu <= 1;
		partial = !ok && (total < ironTotal(before) * 0.85 || after.ironDissolvedMgL < before.ironDissolvedMgL * 0.5);
		goals.push({ label: 'Fer total ≤ 0,20 mg/L', ok: total <= 0.2 });
		goals.push({ label: 'Turbidité ≤ 1 NTU', ok: after.turbidityNtu <= 1 });
		if (after.ironDissolvedMgL > 0.5 && settings.enabled.filtration && !settings.enabled.oxidation) {
			lines.push('La filtration a peu d’effet sur le fer encore dissous. L’oxydation doit d’abord le transformer en particules.');
		} else if (after.ironParticulateMgL > 0.15 && after.ironDissolvedMgL < 0.4) {
			lines.push('Le fer dissous a diminué, mais des particules restent. Vérifiez la filtration, son état et la charge hydraulique.');
		} else if (total > 0.2 && settings.enabled.oxidation) {
			lines.push('La concentration en fer a peu baissé au total. Dose, temps de contact ou séparation peuvent être insuffisants. Doubler une dose déjà forte change peu le rendement.');
		} else if (ok) {
			lines.push('Le fer dissous a été transformé puis séparé. Comparez fer dissous et fer particulaire : les deux comptent.');
		} else {
			lines.push('Le fer est encore largement dans l’eau. Regardez s’il est dissous ou particulaire avant de changer un seul curseur.');
		}
	} else if (study.id === 'turbidite') {
		ok = after.turbidityNtu <= 1;
		partial = !ok && after.turbidityNtu < before.turbidityNtu * 0.7;
		goals.push({ label: 'Turbidité ≤ 1 NTU', ok });
		if (!ok && settings.enabled.filtration && !settings.enabled.coagulation) {
			lines.push('Le filtre seul retient mal ces colloïdes. La coagulation change la taille des particules, si la dose et le pH sont dans la fenêtre utile.');
		} else if (!ok && settings.enabled.coagulation) {
			lines.push('La turbidité baisse trop peu. Une dose trop basse ou trop haute donne un floc médiocre, et la décantation n’y peut pas grand-chose.');
		} else if (ok) {
			lines.push('Les particules ont été regroupées puis retenues. Ce n’est pas un blanc-seing sur les autres paramètres.');
		} else {
			lines.push('L’eau reste trouble. Le tamisage ne remplace pas une clarification.');
		}
	} else if (study.id === 'nitrates') {
		const nitrateOk = after.nitrateMgL <= 50;
		const microOk = after.microbial <= before.microbial + 3;
		ok = nitrateOk && microOk;
		partial = !ok && (nitrateOk || after.nitrateMgL < 65);
		goals.push({ label: 'Nitrates ≤ 50 mg/L', ok: nitrateOk });
		goals.push({ label: 'Indicateur microbien non dégradé', ok: microOk });
		if (settings.enabled.softening && !settings.enabled.nitrate) {
			lines.push('L’adoucissement ne retire pas les nitrates dans ce modèle.');
		}
		if (nitrateOk && !microOk) {
			lines.push('Les nitrates ont baissé, mais l’indicateur microbien a augmenté avec la voie biologique. Une désinfection en aval est nécessaire.');
		} else if (!nitrateOk && settings.enabled.nitrate && settings.nitrateCapacity < 15) {
			lines.push('La capacité est trop basse : le procédé ne retire presque plus rien.');
		} else if (!nitrateOk) {
			lines.push('Les nitrates restent au-dessus de 50 mg/L. Choisissez la dénitrification ou la résine sélective, pas un procédé prévu pour autre chose.');
		} else {
			lines.push('Les nitrates sont sous 50 mg/L et l’indicateur microbien n’a pas été dégradé. Les nitrites, eux, n’ont pas été mesurés.');
		}
	} else if (study.id === 'microbes') {
		const germOk = after.microbial <= 8;
		const clear = after.turbidityNtu <= 1;
		ok = germOk && clear && settings.sourceInvestigated;
		partial = !ok && (germOk || after.microbial < before.microbial * 0.5);
		goals.push({ label: 'Indicateur microbien ≤ 8', ok: germOk });
		goals.push({ label: 'Turbidité ≤ 1 NTU', ok: clear });
		goals.push({ label: 'Origine recherchée', ok: settings.sourceInvestigated });
		if (!germOk && after.turbidityNtu > 2 && (settings.enabled.uv || settings.enabled.chlorine)) {
			lines.push('La désinfection est gênée par la turbidité. Clarifier d’abord change le résultat, à dose identique.');
		} else if (germOk && !settings.sourceInvestigated) {
			lines.push('L’indicateur baisse, mais l’origine de la contamination n’est pas recherchée. Le traitement ne remplace pas cette enquête.');
		} else if (germOk && !clear) {
			lines.push('L’indicateur est bas, mais l’eau reste trouble. Une désinfection sur une eau mal clarifiée reste fragile.');
		} else if (!germOk) {
			lines.push('Les micro-organismes sont encore trop présents. UV, chlore et ozone ne se valent pas, et aucun ne laisse la même trace résiduelle.');
		} else {
			lines.push('L’indicateur d’atelier est bas après clarification et désinfection, et l’origine est marquée comme recherchée. Ce n’est pas un dénombrement E. coli de laboratoire.');
		}
	} else if (study.id === 'durete') {
		const soft = after.hardnessF <= 20 && after.calciumF < before.calciumF && after.magnesiumF < before.magnesiumF;
		ok = soft;
		partial = !ok && after.hardnessF < before.hardnessF - 4;
		goals.push({ label: 'Dureté ≤ 20 °f', ok: after.hardnessF <= 20 });
		goals.push({ label: 'Calcium et magnésium en baisse', ok: after.calciumF < before.calciumF && after.magnesiumF < before.magnesiumF });
		if (!ok && settings.softenerCapacity < 20) {
			lines.push('La résine n’a presque plus de capacité. Régénérer remet la capacité à 100 % dans cet atelier.');
		} else if (!settings.enabled.softening && !settings.enabled.membrane) {
			lines.push('Ni l’aération ni la filtration ne retirent la dureté. L’adoucissement ou une membrane adaptée sont les voies prévues.');
		} else if (ok) {
			lines.push('Calcium et magnésium ont baissé ensemble. Le sodium éventuellement échangé n’est pas suivi ici.');
		} else {
			lines.push('La dureté a peu bougé. La capacité de résine ou la pression membranaire limitent l’effet.');
		}
	} else if (study.id === 'acide') {
		const minerals = after.alkalinityF >= 8 && after.calciumF >= 8;
		ok = phOk(after) && minerals;
		partial = !ok && (phOk(after) || after.alkalinityF > before.alkalinityF + 3);
		goals.push({ label: 'pH entre 6,5 et 9', ok: phOk(after) });
		goals.push({ label: 'Alcalinité ≥ 8 °f et calcium ≥ 8 °f', ok: minerals });
		if (phOk(after) && !minerals && settings.neutralReagent === 'soda' && settings.enabled.neutralization) {
			lines.push('Le pH est corrigé, mais le calcium et l’alcalinité restent bas. La soude n’est pas une reminéralisation.');
		} else if (!phOk(after) && after.calciumF > before.calciumF + 2) {
			lines.push('La minéralisation augmente, mais le pH n’est pas encore dans l’intervalle 6,5–9. Correction de pH et reminéralisation ne font pas le même travail.');
		} else if (ok) {
			lines.push('pH, calcium et alcalinité ont été traités ensemble. L’indice de Langelier reste une indication d’atelier, à 15 °C et 220 mg/L de TDS.');
		} else {
			lines.push('L’eau est encore acide ou très peu minéralisée. Visez le pH sans oublier l’alcalinité.');
		}
	} else if (study.id === 'manganese') {
		const total = manganeseTotal(after);
		ok = total <= 0.05;
		partial = !ok && (total < 0.15 || after.manganeseDissolvedMgL < before.manganeseDissolvedMgL * 0.5);
		goals.push({ label: 'Manganèse total ≤ 0,05 mg/L', ok });
		if (!ok && settings.oxidant === 'chlorine' && settings.enabled.oxidation && before.ph < 7.4 && !settings.enabled.neutralization) {
			lines.push('À ce pH, le chlore transforme peu le manganèse. Le permanganate, l’ozone, ou un pH plus haut avant l’oxydation, changent la donne.');
		} else if (after.manganeseDissolvedMgL < 0.05 && after.manganeseParticulateMgL > 0.05) {
			lines.push('Le manganèse est oxydé mais encore particulaire. La filtration doit suivre.');
		} else if (ok) {
			lines.push('Le manganèse dissous a été oxydé puis retenu. Le résultat dépend du pH, de l’oxydant et du temps de contact.');
		} else {
			lines.push('Le manganèse reste au-dessus de 0,05 mg/L. Oxydation et séparation sont liées : l’un sans l’autre ne suffit pas.');
		}
	} else if (study.id === 'h2s') {
		ok = after.h2sMgL <= 0.01;
		partial = !ok && after.h2sMgL < before.h2sMgL * 0.6;
		goals.push({ label: 'H₂S dans l’eau ≤ 0,01 mg/L', ok });
		if (after.h2sStrippedMgL > 0.01) {
			lines.push(`Environ ${after.h2sStrippedMgL.toFixed(3)} mg/L ont été transférés vers l’air. L’aération ne détruit pas le H₂S. Le gaz est toxique et doit être maîtrisé.`);
		}
		if (after.h2sOxidizedMgL > 0.01 && after.h2sStrippedMgL <= 0.01) {
			lines.push('Le H₂S a été oxydé dans l’eau. Il n’a pas été simplement déplacé vers le local.');
		}
		if (!ok && !partial) {
			lines.push('Le H₂S dissous est encore élevé. Intensité d’aération ou dose d’oxydant sont insuffisantes. L’odeur ne sert pas à régler le procédé.');
		} else if (ok && after.h2sStrippedMgL <= 0.01 && after.h2sOxidizedMgL <= 0.01) {
			lines.push('La concentration dans l’eau est basse. Vérifiez tout de même le bilan : transfert gazeux ou destruction.');
		}
	} else if (study.id === 'organique') {
		ok = after.tocMgL <= 5;
		partial = !ok && after.tocMgL <= 9;
		goals.push({ label: 'COT ≤ 5 mg/L (atelier)', ok });
		lines.push('Le COT seul ne dit pas si la matière est biodégradable ou adsorbable. Le 36 % du filtre biologique est une hypothèse, pas une analyse.');
		if (settings.enabled.filtration && settings.filterMedia === 'bio' && !settings.enabled.carbon && after.tocMgL > 5) {
			lines.push('Le traitement biologique a retiré une part limitée. Le charbon peut aller plus loin si le contact est long et le média peu saturé.');
		} else if (settings.enabled.carbon && settings.carbonSaturation > 70 && after.tocMgL > 5) {
			lines.push('Le charbon est trop saturé pour adsorber encore beaucoup.');
		} else if (ok) {
			lines.push('Le COT a nettement baissé. La référence de 2 mg/L n’est pas garantie par ce seul modèle.');
		} else if (!partial) {
			lines.push('Le COT n’a presque pas bougé. Un procédé de clarification classique ne retire pas cette matière dissoute.');
		}
	} else if (study.id === 'pesticides') {
		ok = after.pesticideUgL <= 0.1;
		partial = !ok && after.pesticideUgL < before.pesticideUgL * 0.8;
		goals.push({ label: 'Pesticide ≤ 0,10 µg/L', ok });
		if (settings.moleculeId === 'faible' && settings.enabled.carbon && !settings.enabled.membrane) {
			lines.push('Cette molécule s’adsorbe mal. Le même charbon ne convient pas à tous les pesticides.');
		} else if (settings.enabled.membrane && settings.membrane === 'uf' && after.pesticideUgL > 0.1) {
			lines.push('L’ultrafiltration laisse passer ce pesticide dissous.');
		} else if (settings.enabled.carbon && settings.carbonSaturation > 60 && after.pesticideUgL > 0.1) {
			lines.push('Le charbon saturé n’a plus assez de capacité pour cette molécule.');
		} else if (ok) {
			lines.push('La molécule choisie est sous 0,10 µg/L. Changez de molécule : le rendement ne se copie pas.');
		} else {
			lines.push('La concentration reste au-dessus de 0,10 µg/L. Temps de contact, saturation, molécule et technologie comptent ensemble.');
		}
	}

	const gasAlert = study.id === 'h2s';
	if (lines.length === 0) lines.push('Comparez l’eau brute et l’eau de sortie, paramètre par paramètre.');
	lines.push('Ce bilan ne permet pas de déclarer l’eau potable.');
	return { status: statusOf(ok, partial), title: TITLES[statusOf(ok, partial)], lines, goals, gasAlert };
}

export function reviewDiagnosis(expected: ProblemId[], selected: ProblemId[]) {
	const correct = selected.filter((id) => expected.includes(id));
	const missed = expected.filter((id) => !selected.includes(id));
	const extra = selected.filter((id) => !expected.includes(id));
	const lines: string[] = [];
	if (correct.length) lines.push(`Hypothèses cohérentes avec les analyses : ${correct.map(labelOf).join(', ')}.`);
	if (missed.length) lines.push(`Hypothèses encore à examiner : ${missed.map(labelOf).join(', ')}.`);
	if (extra.length) lines.push(`Hypothèses non étayées par les mesures disponibles : ${extra.map(labelOf).join(', ')}.`);
	if (!selected.length) lines.push('Aucune hypothèse n’est retenue. Plusieurs problèmes peuvent coexister.');
	if (expected.length > 1 && correct.length === expected.length) {
		lines.push('Plusieurs problèmes sont présents en même temps : la filière doit les prendre tous.');
	}
	return { correct, missed, extra, lines };
}

function labelOf(id: ProblemId): string {
	return PROBLEMS.find((item) => item.id === id)?.label ?? id;
}

const USEFUL: Record<string, ModuleId[]> = {
	fer: ['oxidation', 'filtration', 'aeration'],
	turbidite: ['coagulation', 'settling', 'filtration'],
	nitrates: ['nitrate'],
	microbes: ['uv', 'chlorine', 'ozone', 'filtration'],
	durete: ['softening', 'membrane'],
	acide: ['neutralization', 'remineralization'],
	manganese: ['oxidation', 'filtration', 'neutralization'],
	h2s: ['aeration', 'oxidation', 'ozone'],
	organique: ['carbon', 'filtration'],
	pesticides: ['carbon', 'membrane', 'ozone']
};

export function synthesis(study: StudyCase, simulation: Simulation, settings: TrainSettings, judgement: Judgement, diagnosisSent: boolean) {
	const useful = USEFUL[study.id] ?? [];
	const chosen = useful.filter((id) => settings.enabled[id]);
	const highDose = settings.oxidantDose >= 6 || settings.coagulantDose >= 40 || settings.chlorineDose >= 4;
	return [
		diagnosisSent
			? 'Le diagnostic a été soumis. Il peut être repris sans relancer toute l’application.'
			: 'Le diagnostic n’a pas encore été soumis.',
		chosen.length
			? `Procédés en lien avec ce cas : ${chosen.map((id) => MODULES[id].short).join(', ')}.`
			: 'Aucun procédé directement lié à ce cas n’est en service.',
		`Qualité de sortie : ${judgement.title}.`,
		`Indice de réactifs pédagogiques : ${simulation.reagentIndex.toFixed(0)}. Ce n’est pas un coût en euros.`,
		highDose && judgement.status !== 'atteint'
			? 'Une dose très haute ne compense pas une filière ou un paramètre inadapté : le rendement sature.'
			: 'Regardez le rendement de l’étape, pas seulement la position du curseur.',
		'Pour expliquer le résultat : nommez ce qui a été transformé, ce qui a été séparé, et ce qui a seulement changé de phase.'
	];
}

export function changedRatio(before: number, after: number): number {
	return removalFraction(before, after);
}
