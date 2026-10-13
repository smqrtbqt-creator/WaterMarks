<script lang="ts">
	import { turbidityColor } from '$lib/sim/chemistry';
	import { n } from '$lib/sim/format';

	let {
		turbidityNtu,
		freeMgL,
		probeMgL,
		ph,
		doseMgL,
		contactMin
	}: {
		turbidityNtu: number;
		freeMgL: number;
		probeMgL: number | null;
		ph: number;
		doseMgL: number;
		contactMin: number;
	} = $props();
</script>

<svg class="contact-station" viewBox="0 0 760 280" role="img" aria-label="Cuve de contact, pompe doseuse, hypochlorite, sonde de pH et analyseur de chlore">
	<title>Cuve de contact virtuelle</title>
	<rect x="8" y="8" width="744" height="264" rx="18" fill="#10242c" stroke="rgba(196,224,220,0.2)" />
	<path d="M40 150 H150" stroke="#9fd0d4" stroke-width="8" stroke-linecap="round" />
	<text x="40" y="132" fill="#93aeb0" font-size="13">Arrivée</text>
	<rect x="168" y="78" width="250" height="130" rx="16" fill="#0c1c22" stroke="rgba(196,224,220,0.35)" />
	<rect x="180" y="128" width="226" height="68" rx="10" fill={turbidityColor(turbidityNtu)} />
	<text x="186" y="104" fill="#e8f3f1" font-size="15">Cuve de contact</text>
	<text x="186" y="168" fill="#102018" font-size="13">{n(contactMin, 0)} min · {n(turbidityNtu, 1)} NTU</text>
	<rect x="470" y="36" width="70" height="92" rx="8" fill="#12343a" stroke="rgba(196,224,220,0.35)" />
	<rect x="482" y="58" width="46" height="52" rx="4" fill="#dff56a" opacity="0.85" />
	<text x="470" y="146" fill="#93aeb0" font-size="12">Hypochlorite</text>
	<rect x="560" y="48" width="78" height="36" rx="8" fill="#12303a" stroke="#dff56a" />
	<text x="572" y="71" fill="#e8f3f1" font-size="13">Pompe</text>
	<path d="M520 82 H560 M599 84 H640 V118 H430" fill="none" stroke="#dff56a" stroke-width="4" />
	<circle cx="430" cy="118" r="6" fill="#dff56a" />
	<text x="438" y="112" fill="#dff56a" font-size="12">Injection {n(doseMgL, 2)} mg/L</text>
	<circle cx="250" cy="118" r="16" fill="none" stroke="#8ec8e6" stroke-width="3" />
	<text x="274" y="122" fill="#8ec8e6" font-size="13">pH {n(ph, 2)}</text>
	<rect x="500" y="168" width="210" height="78" rx="12" fill="#0d2129" stroke="rgba(196,224,220,0.35)" />
	<text x="516" y="194" fill="#93aeb0" font-size="13">Analyseur de chlore</text>
	<text x="516" y="222" fill="#e8f3f1" font-size="20">
		{probeMgL === null ? 'Signal perdu' : `${n(probeMgL, 2)} mg/L`}
	</text>
	<path d="M418 190 H470" stroke="#9fd0d4" stroke-width="8" stroke-linecap="round" />
	<text x="430" y="250" fill="#93aeb0" font-size="13">Vers la distribution · libre calculé {n(freeMgL, 2)} mg/L</text>
</svg>
<p class="note">La teinte de l’eau suit la turbidité simulée. Elle ne prouve pas que l’eau est potable.</p>
