import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Eye, EyeOff, X, ChevronLeft, ChevronRight, Sparkles, Zap, BookOpen, Info } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════
   COSMOS EXPLORER v0.9
   An interactive astrophysics primer at first-year-course depth.
   ─────────────────────────────────────────────────────────────────────────── */

// ─── Theme ──────────────────────────────────────────────────────────────────
const BG = '#0b0e17';
const PANEL = '#070912';
const INK = '#e8e4d4';
const DIM = '#8a8676';
const FAINT = '#5a5749';
const ACCENT = '#ffc97a';
const ACCENT2 = '#7ac4ff';
const ACCENT3 = '#ff8a70';
const BORDER = 'rgba(232, 228, 212, 0.12)';
const BORDER_STRONG = 'rgba(232, 228, 212, 0.22)';

const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
    .font-display { font-family: 'Fraunces', 'Times New Roman', serif; font-optical-sizing: auto; }
    .font-mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .grain::before {
      content: ''; position: absolute; inset: 0; pointer-events: none;
      background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
      mix-blend-mode: overlay; opacity: 0.5;
    }
    @keyframes twinkle { 0%, 100% { opacity: 0.3 } 50% { opacity: 0.9 } }
    .twinkle { animation: twinkle 4s ease-in-out infinite; }
    @keyframes fade-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
    .fade-in { animation: fade-in 0.45s ease-out both; }
    input[type="range"] { -webkit-appearance: none; height: 2px; background: ${BORDER_STRONG}; border-radius: 1px; outline: none; }
    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 16px; height: 16px; background: ${ACCENT}; border-radius: 50%; cursor: pointer; border: 2px solid ${BG}; }
    input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; background: ${ACCENT}; border-radius: 50%; cursor: pointer; border: 2px solid ${BG}; }

    @media print {
      .no-print, button, aside { display: none !important; }
      .grain::before { display: none !important; }
      body, html { background: #fff !important; color: #000 !important; }
      * { background: #fff !important; color: #000 !important; border-color: #ccc !important; box-shadow: none !important; }
      .font-display, .font-mono { color: #000 !important; }
      h1, h2, h3, h4 { color: #000 !important; page-break-after: avoid; }
      svg { max-width: 100%; }
      img { max-width: 100%; page-break-inside: avoid; }
      a { color: #000 !important; text-decoration: underline; }
      .fade-in { animation: none !important; }
      @page { margin: 1.5cm; }
    }
  `}</style>
);

// ─── Helpers ────────────────────────────────────────────────────────────────
function spectralColor(temp) {
  if (temp >= 30000) return '#9bb0ff';
  if (temp >= 10000) return '#aabfff';
  if (temp >= 7500)  return '#cad7ff';
  if (temp >= 6000)  return '#f8f7ff';
  if (temp >= 5200)  return '#fff4ea';
  if (temp >= 3700)  return '#ffd2a1';
  return '#ffa070';
}
function spectralLetter(temp) {
  if (temp >= 30000) return 'O';
  if (temp >= 10000) return 'B';
  if (temp >= 7500)  return 'A';
  if (temp >= 6000)  return 'F';
  if (temp >= 5200)  return 'G';
  if (temp >= 3700)  return 'K';
  return 'M';
}
function fmt(n, digits = 2) {
  if (n === 0) return '0';
  const abs = Math.abs(n);
  if (abs >= 1e6 || abs < 1e-3) return n.toExponential(digits);
  if (abs >= 100) return Math.round(n).toLocaleString();
  return Number(n.toPrecision(digits + 1)).toString();
}
const fmtSci = (n, d = 2) => {
  if (n === 0) return '0';
  const exp = Math.floor(Math.log10(Math.abs(n)));
  const mant = n / Math.pow(10, exp);
  if (exp >= -2 && exp <= 3) return mant === 1 && exp === 0 ? '1' : (n).toPrecision(d + 1);
  const sup = String(Math.abs(exp)).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
  return `${mant.toPrecision(d + 1)} × 10${exp < 0 ? '⁻' : ''}${sup}`;
};

// ─── Shared components ──────────────────────────────────────────────────────
function PageShell({ children, onBack, title, eyebrow }) {
  return (
    <div className="min-h-screen relative grain" style={{ background: BG, color: INK }}>
      <FontStyles />
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-6 pb-16">
        <div className="flex items-center justify-between mb-8 no-print">
          {onBack ? (
            <button onClick={onBack}
              className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 transition"
              style={{ color: DIM }}>
              <ArrowLeft size={14} /> back to index
            </button>
          ) : <div />}
          <div className="flex items-center gap-4">
            <button onClick={() => window.print()}
              className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 transition"
              style={{ color: DIM }}
              title="Print or save as PDF">
              ⎙ print
            </button>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em]" style={{ color: DIM }}>
              cosmos explorer · v0.9
            </div>
          </div>
        </div>
        {eyebrow && (
          <div className="font-mono text-xs uppercase tracking-[0.25em] mb-2" style={{ color: ACCENT }}>{eyebrow}</div>
        )}
        {title && (
          <h1 className="font-display font-light text-5xl md:text-6xl mb-8 leading-[1.05]" style={{ letterSpacing: '-0.02em' }}>
            {title}
          </h1>
        )}
        {children}
      </div>
    </div>
  );
}

function Eq({ children }) {
  return (
    <div className="font-mono text-sm py-3 px-4 my-3 rounded"
         style={{ background: 'rgba(255, 201, 122, 0.05)', border: `1px solid ${ACCENT}25`, color: INK }}>
      {children}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>{title}</div>
      <div className="font-display text-[15px] leading-relaxed space-y-3" style={{ color: '#c8c3b1' }}>
        {children}
      </div>
    </div>
  );
}

function KV({ label, value, mono = true }) {
  return (
    <div className="flex justify-between items-baseline gap-4 py-1.5" style={{ borderBottom: `1px solid ${BORDER}` }}>
      <dt className="font-mono text-xs" style={{ color: DIM }}>{label}</dt>
      <dd className={`${mono ? 'font-mono' : 'font-display'} text-xs`} style={{ color: INK }}>{value}</dd>
    </div>
  );
}

function Pill({ children, color = ACCENT }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] px-2 py-1 rounded-sm"
          style={{ color, border: `1px solid ${color}40` }}>{children}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  GLOSSARY — terms appear as dotted-underline hoverables across the app
// ═══════════════════════════════════════════════════════════════════════════
const GLOSSARY = {
  'parsec': 'The distance at which 1 AU subtends 1 arcsecond. 1 pc = 3.26 light-years = 3.086 × 10¹⁶ m. Defined by the geometry of parallax measurement.',
  'parallax': 'The apparent shift of a nearby star against background stars as Earth orbits the Sun. The parallax angle p (in arcseconds) gives distance in parsecs as d = 1/p.',
  'redshift': 'The stretching of light to longer wavelengths. Cosmological redshift (z) arises from the expansion of space itself, while Doppler redshift arises from motion through space. Defined as z = (λ_observed − λ_emitted) / λ_emitted.',
  'luminosity': 'The total power output of a star (in watts or solar luminosities L☉). Distinct from apparent brightness, which depends on distance.',
  'metallicity': 'In astronomy, the abundance of elements heavier than helium. Often expressed as [Fe/H], the logarithmic iron-to-hydrogen ratio relative to the Sun. Pop I stars (like the Sun) are metal-rich; Pop II are metal-poor; Pop III (hypothetical first stars) were metal-free.',
  'main sequence': 'The phase of a star\'s life when it fuses hydrogen into helium in its core. ~90% of a star\'s life is spent on the main sequence. Plotted as a diagonal band on the HR diagram.',
  'stefan-boltzmann': 'The relation L = 4π R² σ T⁴, connecting a star\'s luminosity, radius, and surface temperature. σ ≈ 5.67 × 10⁻⁸ W/m²/K⁴ is the Stefan-Boltzmann constant.',
  'chandrasekhar limit': 'The maximum mass (~1.4 M☉) of a white dwarf supported by electron degeneracy pressure. Above this, the star collapses further into a neutron star or black hole. Derived by Chandrasekhar in 1930 at age 19.',
  'schwarzschild radius': 'The radius r_s = 2GM/c² inside which no signal can escape to infinity. For mass M in solar masses, r_s ≈ 2.95 km × (M/M☉).',
  'event horizon': 'The boundary of a black hole — the surface at r = r_s for Schwarzschild black holes. Inside, all future-directed paths lead toward the singularity.',
  'hawking radiation': 'Thermal radiation predicted to be emitted by black holes due to quantum effects near the event horizon. Temperature is inversely proportional to mass.',
  'cmb': 'The Cosmic Microwave Background — the leftover radiation from the early universe, released when the universe became transparent at recombination (~380,000 years after the Big Bang). Now redshifted to ~2.725 K.',
  'recombination': 'The era ~380,000 years after the Big Bang when electrons combined with nuclei to form neutral atoms. Made the universe transparent to light.',
  'reionization': 'The era starting ~150 Myr after the Big Bang and completing by ~1 Gyr, when UV from the first stars and galaxies re-ionized the neutral hydrogen between galaxies.',
  'inflation': 'A hypothesized brief period (~10⁻³⁶ to ~10⁻³² seconds after the Big Bang) of exponential cosmic expansion. Solves the flatness, horizon, and monopole problems and seeds structure.',
  'dark matter': 'A form of matter that does not interact electromagnetically but exerts gravity. Makes up ~27% of the universe\'s energy. Its particle nature remains unknown.',
  'dark energy': 'The unknown component (~68% of the universe) driving the accelerating expansion of the universe. Observationally consistent with a cosmological constant Λ.',
  'baryonic matter': 'Ordinary matter made of protons, neutrons, and electrons. Only ~5% of the universe\'s energy budget.',
  'cepheid': 'A class of pulsating variable star with a tight relation between pulsation period and intrinsic luminosity. Used as standard candles for measuring distances up to ~50 Mpc.',
  'standard candle': 'An object of known intrinsic luminosity. Compare its brightness to its known luminosity and you get the distance via the inverse-square law.',
  'absolute magnitude': 'The apparent magnitude an object would have at a standard distance of 10 parsecs. A measure of intrinsic luminosity in the magnitude system.',
  'apparent magnitude': 'How bright an object appears from Earth, on a logarithmic scale where lower numbers are brighter. The Sun is −26.7; Sirius is −1.46; the faintest naked-eye stars are ~+6.',
  'spectral class': 'The OBAFGKM classification of stars by surface temperature (hot to cool). Subdivided 0–9 (G2 is hotter than G8). The Sun is G2V.',
  'luminosity class': 'A Roman-numeral suffix to the spectral type indicating evolutionary state. V = main sequence (dwarf), III = giant, I = supergiant, D = white dwarf.',
  'saha equation': 'Governs the ionization balance in a gas. Predicts how much of an element is in each ionization state at a given temperature and electron density.',
  'pp chain': 'Proton-proton chain — the dominant hydrogen-burning process in stars of ≤1.3 M☉. Converts four protons into one ⁴He nucleus, releasing ~26.7 MeV.',
  'cno cycle': 'A hydrogen-fusion pathway using carbon, nitrogen, and oxygen as catalysts. Dominates in stars > ~1.3 M☉ because of its extreme temperature sensitivity (rate ∝ T¹⁷).',
  'triple-alpha': 'The fusion of three ⁴He nuclei into one ¹²C, ignited at ~10⁸ K in red giants. Requires the Hoyle resonance in ¹²C.',
  'binding energy': 'Energy that holds a nucleus together. Per-nucleon binding energy peaks at ⁵⁶Fe. Fusing lighter elements or splitting heavier ones releases energy.',
  'hubble tension': 'The ~5σ disagreement between the locally measured Hubble constant (~73 km/s/Mpc, from Cepheids + Type Ia SNe) and the CMB-inferred value (~67 km/s/Mpc). One of the biggest open problems in cosmology.',
  'big bang nucleosynthesis': 'BBN — the formation of the first light elements (D, ³He, ⁴He, ⁷Li) in the first ~20 minutes after the Big Bang.',
  'planck epoch': 'The earliest moment in cosmic history (before t ≈ 10⁻⁴³ s) where known physics breaks down and a theory of quantum gravity is needed.',
  'ism': 'The Interstellar Medium — the gas and dust filling space between stars within a galaxy. Has multiple phases from cold molecular clouds to hot ionized gas.',
  'agb': 'Asymptotic Giant Branch — late phase of evolution for low- and intermediate-mass stars, characterized by thermal pulses and heavy mass loss before becoming a white dwarf.',
  'isco': 'Innermost Stable Circular Orbit — the closest stable circular orbit around a black hole. r = 3 r_s for non-spinning (Schwarzschild) holes; can be as small as 0.5 r_s for maximally rotating Kerr holes.',
  'photon sphere': 'The radius (1.5 r_s for Schwarzschild) at which light can theoretically orbit a black hole. Unstable orbit. Visible as the bright ring in EHT images.',
  'eht': 'Event Horizon Telescope — a global network of radio telescopes that imaged the shadows of supermassive black holes in M87 (2019) and Sgr A* (2022).',
  'mk classification': 'Morgan-Keenan stellar classification system — combines spectral type (O-M) with luminosity class (I-V). The Sun is G2V; Betelgeuse is M1-2Ia.',
  'hr diagram': 'Hertzsprung-Russell diagram — a plot of stellar luminosity (vertical) vs surface temperature (horizontal, reversed). Reveals stellar evolution as patterns on the diagram.',
  'tidal locking': 'When a body\'s rotation period equals its orbital period, so the same face always points toward its partner. The Moon is tidally locked to Earth.',
  'libration': 'Apparent rocking of the Moon (or any tidally locked body) due to orbital eccentricity and inclination. Lets us see ~59% of the Moon\'s surface over time.',
  'synodic month': 'The 29.53-day period from one new moon to the next, longer than the sidereal month (27.32 d) because Earth moves around the Sun during the Moon\'s orbit.',
  'sidereal month': 'The 27.32-day period for the Moon to return to the same position relative to the stars.',
  'saros cycle': 'An 18-year-11-day-8-hour eclipse repetition period, used since Babylonian times. Eclipses one Saros apart have nearly identical geometry.',
  'transit method': 'Detecting exoplanets by observing the small dip in starlight when a planet passes in front of its star. Used by Kepler and TESS.',
  'radial velocity': 'Detecting exoplanets by measuring the Doppler shift of a star\'s spectrum as it wobbles around the common centre of mass with its planet(s).',
  'habitable zone': 'The orbital range around a star where a rocky planet could maintain liquid water on its surface. Scales as a ∝ √L.',
  'sn ia': 'Type Ia supernova — thermonuclear explosion of a white dwarf that exceeded the Chandrasekhar limit by accretion or merger. Standardisable candle reaching cosmological distances.',
  'friedmann equations': 'The equations from general relativity that govern the expansion of a homogeneous, isotropic universe. Connect the Hubble parameter to the energy density.',
  'lambda cdm': 'The standard cosmological model: a universe dominated by a cosmological constant (Λ) and cold dark matter (CDM), with ordinary matter, radiation, and neutrinos.',
  'ergosphere': 'Region outside the event horizon of a rotating (Kerr) black hole where spacetime is dragged so strongly that no observer can remain stationary.',
  'planetary nebula': 'The expanding shell of gas expelled by a low- or intermediate-mass star at the end of its AGB phase, illuminated by the exposed hot core (a future white dwarf). Nothing to do with planets.',
  'semi-major axis': 'Half the longest diameter of an ellipse, denoted a. For an orbit, it equals the average of the perihelion and aphelion distances. Determines orbital energy and period via Kepler\'s third law.',
  'eccentricity': 'A number 0 ≤ e < 1 that measures how stretched an elliptical orbit is. e = 0 is circular; e = 0.5 is moderately elliptical; e → 1 approaches parabolic (escape). Earth\'s e is 0.0167; Halley\'s comet is 0.967.',
  'escape velocity': 'The minimum speed needed to escape a gravitating body without further propulsion. v_esc = √(2GM/r). Earth\'s surface escape velocity is 11.2 km/s; the Sun\'s is 617 km/s.',
  'lagrange point': 'One of five locations in a two-body system where a small third body can orbit synchronously with the larger two. L1, L2, L3 are unstable; L4 and L5 are stable. The JWST sits at the Sun-Earth L2.',
  'roche limit': 'The orbital radius below which a celestial body, held together only by self-gravity, is torn apart by tidal forces from a larger primary. Saturn\'s rings lie inside its Roche limit.',
  'hohmann transfer': 'The most fuel-efficient two-burn manoeuvre between two circular orbits around the same body. Travels along an ellipse tangent to both. Used by most interplanetary missions.',
  'orbital resonance': 'When two orbiting bodies have orbital periods related by a small-integer ratio. Causes stable or unstable mutual gravitational interactions. Examples: Neptune and Pluto are in 3:2 resonance; Io, Europa, Ganymede are in 4:2:1 (Laplace resonance).',
  'gravity assist': 'Using a planetary flyby to change a spacecraft\'s velocity by stealing a tiny amount of the planet\'s orbital energy. Allowed Voyager to reach all four giant planets; lets New Horizons reach Pluto in 9 years.',
  'tidal force': 'The differential gravitational force a body experiences across its extent because gravity weakens with distance. Causes ocean tides, tidal heating (e.g. Io), and tidal disruption of stars by black holes.',
  'frost line': 'The distance from a young star (~3 AU around a Sun-like star) beyond which volatiles like water, ammonia, and methane condense to solid ice. Inside the line: rocky planets. Outside: ice giants and gas giants.',
  'differentiation': 'The process by which a molten planet sorts itself by density — heavy elements (iron, nickel) sink to form a core, lighter materials (silicates) float to form a mantle and crust. All terrestrial planets are differentiated.',
  'accretion': 'The gradual growth of a body by accumulating surrounding material — gas, dust, or smaller bodies (planetesimals). The dominant mode of planet formation, and also of black-hole growth.',
  'planetesimal': 'A solid object 1 km to ~100 km in size formed in the early solar nebula, the building block of planets. Surviving examples today are asteroids and comets.',
  'kuiper belt': 'A disk of icy bodies beyond Neptune\'s orbit (30–50 AU), containing Pluto, Eris, and many smaller worlds. Short-period comets originate here.',
  'oort cloud': 'A hypothesised spherical shell of icy bodies at ~2,000 to 200,000 AU, from which long-period comets originate. Inferred but never directly observed.',
  'diffraction limit': 'The fundamental angular resolution limit of any optical system, set by the wave nature of light: θ ≈ 1.22 λ/D, where D is the aperture diameter and λ is the wavelength. Bigger apertures and shorter wavelengths give sharper images.',
  'seeing': 'The blurring of astronomical images caused by turbulence in Earth\'s atmosphere. Even with a giant telescope, ground-based seeing limits typical visible-light resolution to ~1 arcsecond at average sites, ~0.4 arcsec at the best sites.',
  'adaptive optics': 'A technique using deformable mirrors to correct atmospheric turbulence in real time, allowing ground-based telescopes to approach their diffraction limit. Requires a bright reference star (natural or laser-generated).',
  'ccd': 'Charge-Coupled Device — a silicon imaging detector that revolutionised astronomy in the 1980s. CCDs are ~50× more sensitive than photographic plates and digitise output directly. Nearly all modern telescopes use them or successor CMOS detectors.',
  'photometry': 'The measurement of total light intensity from an astronomical object through specific filters. Most exoplanet detection, supernova searches, and variable star monitoring rely on precise photometry.',
  'spectroscopy': 'The measurement of light intensity as a function of wavelength. Splitting light into its spectrum reveals composition, temperature, motion, magnetic fields, and rotation of distant objects.',
  'interferometry': 'Combining light from multiple telescopes to achieve angular resolution equivalent to a single telescope as large as the separation between them. Used at radio (VLA, EHT) and optical (VLTI, CHARA) wavelengths.',
  'atmospheric window': 'A band of wavelengths at which Earth\'s atmosphere is reasonably transparent. The main optical window is ~300–1100 nm; the radio window is ~1 cm to ~10 m. Other wavelengths (most IR, UV, X-ray, gamma) require space-based telescopes.',
  'quark': 'A fundamental matter particle that experiences the strong force. Six flavours exist (up, down, charm, strange, top, bottom). Protons and neutrons are made of up and down quarks bound by gluons. Quarks have fractional electric charge.',
  'lepton': 'A fundamental matter particle that does not experience the strong force. Six types: electron, muon, tau (charged) and their three neutrinos. The electron orbits the atomic nucleus; muons and taus are heavier unstable cousins.',
  'gauge boson': 'A force-carrier particle. The Standard Model has four: photon (electromagnetism), W and Z (weak force), gluon (strong force). The hypothetical graviton would carry gravity but is not part of the Standard Model.',
  'higgs boson': 'A scalar particle discovered at the LHC in 2012, completing the Standard Model. Its associated Higgs field gives mass to all other massive particles via the Higgs mechanism. Discovery: 2013 Nobel for Higgs and Englert.',
  'antimatter': 'For every matter particle there is an antiparticle with opposite charge but identical mass. The positron is the electron\'s antiparticle. Matter and antimatter annihilate on contact, producing photons. Why the universe is matter-dominated remains an open question.',
  'cp violation': 'A subtle asymmetry where the laws of physics behave slightly differently for matter vs antimatter (after also flipping left and right). Observed in kaons, B mesons, and D mesons. Necessary but not sufficient to explain matter-antimatter asymmetry of the universe.',
  'standard model': 'The current best theory of fundamental particles and three of the four forces (excluding gravity). Includes 17 fundamental particles: 6 quarks, 6 leptons, 4 gauge bosons, and the Higgs. Predictions verified to extraordinary precision; but doesn\'t include gravity or dark matter.',
};

function Term({ k, children }) {
  const [open, setOpen] = useState(false);
  const def = GLOSSARY[k?.toLowerCase()];
  if (!def) return <span>{children}</span>;
  return (
    <span style={{ position: 'relative', display: 'inline' }}>
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        style={{
          cursor: 'help',
          borderBottom: `1px dotted ${ACCENT}`,
          color: 'inherit',
        }}>
        {children}
      </span>
      {open && (
        <span style={{
          position: 'absolute',
          bottom: '100%',
          left: '0',
          marginBottom: 8,
          padding: '12px 14px',
          background: '#0d1018',
          border: `1px solid ${ACCENT}40`,
          borderRadius: 4,
          width: 320,
          maxWidth: '90vw',
          zIndex: 100,
          fontSize: '13px',
          fontFamily: 'Fraunces, serif',
          color: '#c8c3b1',
          lineHeight: 1.5,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          display: 'block',
        }}>
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            color: ACCENT,
            display: 'block',
            marginBottom: 6,
          }}>{k}</span>
          {def}
        </span>
      )}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  SHARED INTERACTIVE COMPONENTS
//  Worked example, quiz, numerical playground, open-questions sidebar, photo
// ═══════════════════════════════════════════════════════════════════════════

function WorkedExample({ title, steps }) {
  const [step, setStep] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const current = steps[step];

  return (
    <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT}30`, background: 'rgba(255, 201, 122, 0.03)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Pill>worked example</Pill>
          <span className="font-mono text-xs" style={{ color: DIM }}>
            Step {step + 1} of {steps.length}
          </span>
        </div>
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className="w-6 h-0.5 rounded-full transition"
                 style={{ background: i <= step ? ACCENT : BORDER }} />
          ))}
        </div>
      </div>

      <h4 className="font-display text-xl mb-4" style={{ letterSpacing: '-0.01em' }}>{title}</h4>

      <div className="fade-in" key={step}>
        <div className="font-display text-base leading-relaxed mb-4" style={{ color: '#c8c3b1' }}>
          {current.text}
        </div>
        {current.eq && (
          <Eq>{current.eq}</Eq>
        )}
        {current.answer && (
          <div className="mt-4">
            {!revealed ? (
              <button onClick={() => setRevealed(true)}
                className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded transition"
                style={{ color: ACCENT, border: `1px solid ${ACCENT}40` }}>
                Reveal answer
              </button>
            ) : (
              <div className="p-4 rounded fade-in" style={{ background: 'rgba(122, 196, 255, 0.06)', border: `1px solid ${ACCENT2}30` }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: ACCENT2 }}>Answer</div>
                <div className="font-display text-base" style={{ color: INK }}>{current.answer}</div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={() => { setStep(Math.max(0, step - 1)); setRevealed(false); }}
                disabled={step === 0}
                className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-3 py-2 rounded transition disabled:opacity-30"
                style={{ color: INK, border: `1px solid ${BORDER}` }}>
          <ChevronLeft size={12} /> previous
        </button>
        <button onClick={() => { setStep(Math.min(steps.length - 1, step + 1)); setRevealed(false); }}
                disabled={step === steps.length - 1}
                className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-3 py-2 rounded transition disabled:opacity-30"
                style={{ color: BG, background: ACCENT }}>
          next <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

function Quiz({ questions }) {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  function chooseAnswer(qIdx, optIdx) {
    setAnswers(a => ({ ...a, [qIdx]: optIdx }));
    setRevealed(r => ({ ...r, [qIdx]: true }));
  }

  return (
    <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT2}30`, background: 'rgba(122, 196, 255, 0.03)' }}>
      <div className="flex items-center justify-between mb-6">
        <Pill color={ACCENT2}>quick check</Pill>
        <span className="font-mono text-xs" style={{ color: DIM }}>
          {Object.keys(revealed).length} / {questions.length} answered
        </span>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIdx) => (
          <div key={qIdx}>
            <div className="font-display text-base mb-4" style={{ color: INK }}>
              <span className="font-mono text-sm mr-2" style={{ color: ACCENT2 }}>{qIdx + 1}.</span>
              {q.q}
            </div>
            <div className="space-y-2">
              {q.options.map((opt, optIdx) => {
                const isChosen = answers[qIdx] === optIdx;
                const isCorrect = optIdx === q.correct;
                const isRevealed = revealed[qIdx];
                let bg = BG, border = BORDER, color = INK;
                if (isRevealed) {
                  if (isCorrect) { bg = 'rgba(122, 255, 122, 0.08)'; border = '#7aff7a60'; color = '#c8e8c8'; }
                  else if (isChosen) { bg = 'rgba(255, 122, 122, 0.06)'; border = '#ff7a7a40'; color = '#e8c8c8'; }
                  else { color = DIM; }
                }
                return (
                  <button key={optIdx}
                    onClick={() => !isRevealed && chooseAnswer(qIdx, optIdx)}
                    disabled={isRevealed}
                    className="w-full text-left px-4 py-3 rounded transition font-display text-sm"
                    style={{ background: bg, border: `1px solid ${border}`, color,
                             cursor: isRevealed ? 'default' : 'pointer' }}>
                    <span className="font-mono text-xs mr-2 opacity-60">{['A', 'B', 'C', 'D'][optIdx]}.</span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {revealed[qIdx] && q.explain && (
              <div className="mt-3 px-4 py-3 rounded fade-in font-display text-sm leading-relaxed"
                   style={{ background: 'rgba(255, 255, 255, 0.02)', color: '#c8c3b1' }}>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] mr-2" style={{ color: ACCENT }}>why</span>
                {q.explain}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OpenQuestions({ items }) {
  return (
    <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT3}30`, background: 'rgba(255, 138, 112, 0.03)' }}>
      <div className="flex items-center gap-3 mb-4">
        <Pill color={ACCENT3}>what we don't know</Pill>
      </div>
      <p className="font-display text-sm italic mb-5" style={{ color: DIM }}>
        Every topic has its frontiers. These are the open questions in this area where genuine
        research is happening right now.
      </p>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>
            <span style={{ color: ACCENT3 }}>◆</span> <strong style={{ color: INK }}>{item.q}</strong> {item.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TryThis({ title, items }) {
  return (
    <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT}30`, background: 'rgba(255, 201, 122, 0.03)' }}>
      <div className="flex items-center gap-3 mb-4">
        <Pill>try this yourself</Pill>
      </div>
      <h4 className="font-display text-xl mb-4" style={{ letterSpacing: '-0.01em' }}>{title}</h4>
      <ul className="space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-4">
            <div className="font-mono text-xs" style={{ color: ACCENT, minWidth: 24 }}>{String(i + 1).padStart(2, '0')}</div>
            <div className="flex-1">
              <div className="font-display text-base mb-1" style={{ color: INK }}>{item.title}</div>
              <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{item.text}</div>
              {item.gear && (
                <div className="font-mono text-[10px] uppercase tracking-[0.15em] mt-2" style={{ color: DIM }}>
                  gear: {item.gear}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Photo({ src, alt, caption, credit }) {
  return (
    <figure className="my-8" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
      <img src={src} alt={alt} style={{ width: '100%', display: 'block' }} />
      {(caption || credit) && (
        <figcaption className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          {caption && (
            <div className="font-display text-sm leading-relaxed mb-1" style={{ color: '#c8c3b1' }}>{caption}</div>
          )}
          {credit && (
            <div className="font-mono text-[10px] uppercase tracking-[0.15em]" style={{ color: DIM }}>credit: {credit}</div>
          )}
        </figcaption>
      )}
    </figure>
  );
}

// Numerical playground — input fields with live computed outputs
function fmtPlayground(n) {
  if (typeof n !== 'number' || !isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs < 1e-3 || abs >= 1e5) return n.toExponential(2);
  if (abs >= 100) return n.toFixed(0);
  if (abs >= 10) return n.toFixed(1);
  if (abs >= 1) return n.toFixed(2);
  return n.toPrecision(3);
}

function Playground({ title, description, inputs, compute, outputs }) {
  const [values, setValues] = useState(() =>
    Object.fromEntries(inputs.map(i => [i.key, i.default]))
  );
  const results = compute(values);

  return (
    <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT}30`, background: 'rgba(255, 201, 122, 0.04)' }}>
      <div className="flex items-center gap-3 mb-3">
        <Pill>playground</Pill>
      </div>
      <h4 className="font-display text-xl mb-2" style={{ letterSpacing: '-0.01em' }}>{title}</h4>
      {description && (
        <p className="font-display text-sm mb-5 leading-relaxed" style={{ color: DIM }}>{description}</p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>Inputs</div>
          <div className="space-y-4">
            {inputs.map(inp => (
              <div key={inp.key}>
                <div className="flex justify-between items-baseline mb-1">
                  <label className="font-display text-sm" style={{ color: INK }}>{inp.label}</label>
                  <span className="font-mono text-xs" style={{ color: ACCENT }}>
                    {fmtPlayground(values[inp.key])}
                    {inp.unit && <span style={{ color: DIM }}> {inp.unit}</span>}
                  </span>
                </div>
                <input type="range"
                       min={inp.min}
                       max={inp.max}
                       step={inp.step || (inp.log ? 0.01 : (inp.max - inp.min) / 100)}
                       value={inp.log ? Math.log10(values[inp.key]) : values[inp.key]}
                       onChange={e => {
                         const v = parseFloat(e.target.value);
                         setValues(vs => ({ ...vs, [inp.key]: inp.log ? Math.pow(10, v) : v }));
                       }}
                       className="w-full" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT2 }}>Computed</div>
          <div className="space-y-2">
            {outputs.map(out => {
              const val = results[out.key];
              let display;
              if (val === undefined || val === null) display = '—';
              else if (typeof val === 'number') display = fmtPlayground(val);
              else display = String(val);
              return (
                <div key={out.key} className="flex justify-between items-baseline py-2"
                     style={{ borderBottom: `1px solid ${BORDER}` }}>
                  <span className="font-display text-sm" style={{ color: '#c8c3b1' }}>{out.label}</span>
                  <span className="font-mono text-sm" style={{ color: INK }}>
                    {display}
                    {out.unit && <span style={{ color: DIM }}> {out.unit}</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  LEARNING PATHS PAGE
// ═══════════════════════════════════════════════════════════════════════════
const PATHS = {
  newcomer: {
    icon: '🌱',
    title: 'Newcomer',
    sub: 'No mathematical background assumed',
    desc: 'Visual intuition first, equations as context. Start with what you can already observe yourself, then build outward from the familiar to the cosmic. Equations appear, but you can skip past them — the prose carries the story.',
    order: ['obs', 'moon', 'ss', 'sizes', 'tel', 'spec', 'hr', 'life', 'orb', 'exo', 'gal', 'bb', 'cmb', 'fusion', 'ladder', 'bh', 'sr', 'sm'],
    note: 'Start with things you can verify with your own eyes (constellations, Moon, nearby planets), then learn what light and telescopes reveal, then move outward to stars, galaxies, and finally the deepest physics including the particles that build everything.',
  },
  refresher: {
    icon: '🔄',
    title: 'Refresher',
    sub: "You've seen this before",
    desc: "Core spine of stellar physics and cosmology, in the order they're usually taught. Skip the gentle warmups and go straight for the central machinery.",
    order: ['orb', 'tel', 'spec', 'hr', 'life', 'fusion', 'sm', 'sr', 'ladder', 'exo', 'gal', 'bb', 'cmb', 'bh', 'ss', 'moon', 'obs'],
    note: 'Heavily weighted to stellar astrophysics in the first half, cosmology and extreme physics in the second. Particle physics sits next to fusion as the underlying microscopic theory.',
  },
  deepdiver: {
    icon: '🔬',
    title: 'Deep diver',
    sub: 'Career-transition preparation',
    desc: 'Follow the physics. Start with the most fundamental processes (particles, orbits, relativity, fusion) and build outward. Pay close attention to derivations, scaling laws, and the worked examples in each topic.',
    order: ['sm', 'orb', 'sr', 'fusion', 'tel', 'spec', 'hr', 'life', 'bh', 'ladder', 'cmb', 'bb', 'gal', 'exo', 'ss', 'moon', 'obs'],
    note: 'This path treats astronomy as applied physics. The Standard Model is the substrate — every nucleosynthesis reaction, every photon detection, every neutrino oscillation runs on it. Then orbital mechanics and special relativity, then stellar and cosmological scale phenomena.',
  },
};

function LearningPaths({ onBack, onSelect }) {
  const [chosen, setChosen] = useState('newcomer');
  const path = PATHS[chosen];
  return (
    <PageShell onBack={onBack} eyebrow="Curriculum"
               title={<>Suggested <em style={{ color: ACCENT, fontStyle: 'italic' }}>Learning Paths</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Topics can be explored in any order — each stands alone. But there are coherent paths through
        them. Pick the one that fits where you are.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-10" style={{ background: BORDER }}>
        {Object.entries(PATHS).map(([key, p]) => (
          <button key={key} onClick={() => setChosen(key)}
                  className="p-6 text-left transition"
                  style={{ background: chosen === key ? `${ACCENT}10` : BG,
                           borderTop: chosen === key ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="text-3xl mb-3">{p.icon}</div>
            <div className="font-display text-2xl mb-1" style={{ letterSpacing: '-0.01em', color: chosen === key ? ACCENT : INK }}>{p.title}</div>
            <div className="font-mono text-xs" style={{ color: DIM }}>{p.sub}</div>
          </button>
        ))}
      </div>

      <div className="fade-in" key={chosen}>
        <p className="font-display text-base leading-relaxed mb-8 max-w-3xl" style={{ color: '#c8c3b1' }}>
          {path.desc}
        </p>

        <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>
          The path · {path.order.length} topics
        </div>
        <div className="space-y-px mb-8" style={{ background: BORDER }}>
          {path.order.map((topicId, idx) => {
            const topic = TOPICS.find(t => t.id === topicId);
            if (!topic) return null;
            return (
              <button key={topicId} onClick={() => topic.ready && onSelect(topicId)}
                      disabled={!topic.ready}
                      className={`w-full text-left p-5 transition ${topic.ready ? 'hover:bg-white/[0.03]' : ''}`}
                      style={{ background: BG, cursor: topic.ready ? 'pointer' : 'not-allowed' }}>
                <div className="flex items-center gap-5">
                  <div className="font-mono text-2xl" style={{ color: DIM, minWidth: 40 }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-xl" style={{ color: topic.ready ? INK : DIM, letterSpacing: '-0.01em' }}>
                      {topic.title}
                    </div>
                    <div className="font-display text-sm mt-1" style={{ color: DIM }}>{topic.sub}</div>
                  </div>
                  {topic.ready ? (
                    <span className="font-mono text-xs" style={{ color: ACCENT }}>→</span>
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>soon</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-start gap-3 max-w-2xl">
          <Sparkles size={14} style={{ color: ACCENT, marginTop: 4 }} />
          <p className="font-mono text-xs leading-relaxed" style={{ color: DIM }}>{path.note}</p>
        </div>
      </div>
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  STAR CATALOGUE (curated for teaching)
// ═══════════════════════════════════════════════════════════════════════════
const STARS = [
  { name: 'Proxima Centauri',   temp: 3042,  lum: 0.0017,  radius: 0.154, mass: 0.122, type: 'M5.5Ve', cls: 'MS', dist: 4.24,    fact: 'The closest star to the Sun. Hosts at least one Earth-mass planet in its habitable zone.' },
  { name: "Barnard's Star",     temp: 3134,  lum: 0.0035,  radius: 0.196, mass: 0.144, type: 'M4V',    cls: 'MS', dist: 5.96,    fact: 'Highest known proper motion — visibly drifts across our sky over decades.' },
  { name: 'Lacaille 9352',      temp: 3626,  lum: 0.0367,  radius: 0.482, mass: 0.486, type: 'M0.5V',  cls: 'MS', dist: 10.74,   fact: 'One of the brightest red dwarfs as seen from Earth.' },
  { name: 'Alpha Centauri B',   temp: 5260,  lum: 0.5,     radius: 0.865, mass: 0.907, type: 'K1V',    cls: 'MS', dist: 4.37,    fact: 'The Sun’s slightly cooler companion — an orange dwarf in our nearest stellar system.' },
  { name: 'Epsilon Eridani',    temp: 5084,  lum: 0.34,    radius: 0.735, mass: 0.82,  type: 'K2V',    cls: 'MS', dist: 10.5,    fact: 'A young (~800 Myr) K-dwarf with debris disks — like seeing our solar system as a child.' },
  { name: 'Sun',                temp: 5778,  lum: 1,       radius: 1,     mass: 1,     type: 'G2V',    cls: 'MS', dist: 0.0000158, fact: 'Our home star. Halfway through its ~10-billion-year main-sequence life.' },
  { name: 'Alpha Centauri A',   temp: 5790,  lum: 1.519,   radius: 1.2234,mass: 1.0788,type: 'G2V',    cls: 'MS', dist: 4.37,    fact: 'Nearly a twin of the Sun — a key benchmark for stellar physics.' },
  { name: 'Tau Ceti',           temp: 5344,  lum: 0.52,    radius: 0.793, mass: 0.783, type: 'G8V',    cls: 'MS', dist: 11.9,    fact: 'A nearby Sun-like star searched repeatedly for Earth-like planets.' },
  { name: 'Procyon A',          temp: 6530,  lum: 6.93,    radius: 2.048, mass: 1.499, type: 'F5IV-V', cls: 'MS', dist: 11.46,   fact: 'Already beginning to evolve off the main sequence.' },
  { name: 'Altair',             temp: 7550,  lum: 10.6,    radius: 1.79,  mass: 1.86,  type: 'A7V',    cls: 'MS', dist: 16.73,   fact: 'Spins so fast (~9 hours per rotation) that it is visibly flattened.' },
  { name: 'Vega',               temp: 9602,  lum: 40.12,   radius: 2.362, mass: 2.135, type: 'A0V',    cls: 'MS', dist: 25.04,   fact: 'Photometric magnitude standard. Pole star ~12,000 BCE.' },
  { name: 'Sirius A',           temp: 9940,  lum: 25.4,    radius: 1.711, mass: 2.063, type: 'A1V',    cls: 'MS', dist: 8.6,     fact: 'Brightest star in our night sky — largely because it is close.' },
  { name: 'Fomalhaut',          temp: 8590,  lum: 16.63,   radius: 1.842, mass: 1.92,  type: 'A3V',    cls: 'MS', dist: 25.13,   fact: 'Surrounded by a sharp-edged debris ring directly imaged from Earth.' },
  { name: 'Regulus A',          temp: 12460, lum: 316,     radius: 4.35,  mass: 3.8,   type: 'B8IVn',  cls: 'MS', dist: 79.3,    fact: 'Spinning near its breakup velocity — visibly oblate.' },
  { name: 'Bellatrix',          temp: 22000, lum: 9211,    radius: 5.75,  mass: 8.6,   type: 'B2III',  cls: 'MS', dist: 250,     fact: 'A massive hot star nearing the end of core hydrogen burning.' },
  { name: 'Spica',              temp: 22400, lum: 20512,   radius: 7.47,  mass: 11.43, type: 'B1V',    cls: 'MS', dist: 250,     fact: 'A binary of two hot blue stars — among the most luminous nearby stars.' },
  { name: 'Pollux',             temp: 4666,  lum: 43,      radius: 9.06,  mass: 1.91,  type: 'K0III',  cls: 'G',  dist: 33.78,   fact: 'An orange giant — has exhausted core hydrogen and swollen.' },
  { name: 'Arcturus',           temp: 4286,  lum: 170,     radius: 25.4,  mass: 1.08,  type: 'K1.5III',cls: 'G',  dist: 36.66,   fact: 'What the Sun will resemble in ~5 Gyr. Currently burning helium in the core.' },
  { name: 'Aldebaran',          temp: 3910,  lum: 518,     radius: 45.1,  mass: 1.16,  type: 'K5III',  cls: 'G',  dist: 65,      fact: 'The “eye of Taurus” — a cool, large red giant.' },
  { name: 'Capella Aa',         temp: 4970,  lum: 78.7,    radius: 11.98, mass: 2.5687,type: 'G8III',  cls: 'G',  dist: 42.92,   fact: 'Brightest yellow giant in our skies; part of a quadruple system.' },
  { name: 'Mira',               temp: 3000,  lum: 8400,    radius: 332,   mass: 1.18,  type: 'M7IIIe', cls: 'G',  dist: 92,      fact: 'A pulsating asymptotic-giant-branch (AGB) star — brightness varies ~1500×.' },
  { name: 'Polaris Aa',         temp: 6015,  lum: 1260,    radius: 37.5,  mass: 5.4,   type: 'F7Ib',   cls: 'SG', dist: 132.6,   fact: 'A yellow supergiant Cepheid variable — a distance calibrator.' },
  { name: 'Deneb',              temp: 8525,  lum: 196000,  radius: 203,   mass: 19,    type: 'A2Ia',   cls: 'SG', dist: 802,     fact: 'Among the most luminous naked-eye stars, despite ~800 ly distance.' },
  { name: 'Rigel',              temp: 12100, lum: 120000,  radius: 78.9,  mass: 21,    type: 'B8Ia',   cls: 'SG', dist: 264.6,   fact: 'Blue supergiant in Orion. Future core-collapse supernova.' },
  { name: 'Antares',            temp: 3660,  lum: 75900,   radius: 680,   mass: 12,    type: 'M1.5Iab',cls: 'SG', dist: 169.7,   fact: 'A red supergiant — placed at the Sun, would engulf Mars.' },
  { name: 'Betelgeuse',         temp: 3500,  lum: 126000,  radius: 887,   mass: 17.5,  type: 'M1-2Ia', cls: 'SG', dist: 168,     fact: 'A red supergiant late in its life — supernova candidate within ~100 kyr.' },
  { name: 'VY Canis Majoris',   temp: 3490,  lum: 270000,  radius: 1420,  mass: 17,    type: 'M3-M5e Ia', cls: 'SG', dist: 1170, fact: 'A red hypergiant — among the largest known stars.' },
  { name: 'Sirius B',           temp: 25200, lum: 0.056,   radius: 0.0084,mass: 1.018, type: 'DA2',    cls: 'WD', dist: 8.6,     fact: 'A white dwarf — Earth-sized but Sun-massed. A teaspoon weighs tonnes.' },
  { name: 'Procyon B',          temp: 7740,  lum: 0.00049, radius: 0.012, mass: 0.602, type: 'DQZ',    cls: 'WD', dist: 11.46,   fact: 'A white dwarf cooling slowly toward eventual black-dwarf state.' },
  { name: "Van Maanen's Star",  temp: 6220,  lum: 0.00017, radius: 0.014, mass: 0.68,  type: 'DZ8',    cls: 'WD', dist: 14.07,   fact: 'First isolated white dwarf ever discovered (1917).' },
];

// ═══════════════════════════════════════════════════════════════════════════
//  HUB
// ═══════════════════════════════════════════════════════════════════════════
const TOPICS = [
  { id: 'obs',    n: '01', title: 'Observational Astronomy',       sub: 'Constellations, the sky tonight, and how to look up',  ready: true },
  { id: 'moon',   n: '02', title: 'The Moon · Phases & Tides',     sub: 'Our nearest neighbour and the rhythms it drives',     ready: true },
  { id: 'ss',     n: '03', title: 'The Solar System',              sub: 'Worlds, rings, ice & rock — eight planets and what fills the gaps', ready: true },
  { id: 'sizes',  n: '04', title: 'Stellar Size Comparison',       sub: 'From Earth to hypergiant by orders of magnitude',     ready: true },
  { id: 'tel',    n: '05', title: 'How Telescopes See',            sub: 'Light, resolution & detectors — what astronomers actually do', ready: true },
  { id: 'spec',   n: '06', title: 'Spectral Classification',       sub: 'Reading the bar code of stellar light',               ready: true },
  { id: 'hr',     n: '07', title: 'Hertzsprung–Russell Diagram',   sub: 'Temperature, luminosity, and the lives of stars',     ready: true },
  { id: 'life',   n: '08', title: 'The Stellar Lifecycle',         sub: 'How a star’s initial mass decides its entire fate',   ready: true },
  { id: 'fusion', n: '09', title: 'Nuclear Fusion in Stars',       sub: 'The binding energy curve and the chains of burning', ready: true },
  { id: 'orb',    n: '10', title: 'Orbits & Gravity',              sub: 'Falling sideways forever — Kepler, Newton, and weird loops', ready: true },
  { id: 'exo',    n: '11', title: 'Exoplanet Detection',           sub: 'Transits, radial velocity, microlensing, imaging',    ready: true },
  { id: 'ladder', n: '12', title: 'The Cosmic Distance Ladder',    sub: 'How we measure the universe, step by step',           ready: true },
  { id: 'gal',    n: '13', title: 'Galaxy Morphology',             sub: 'The Hubble sequence and modern classifications',      ready: true },
  { id: 'bb',     n: '14', title: 'The Big Bang Timeline',         sub: 'From Planck era to recombination, logarithmically',   ready: true },
  { id: 'cmb',    n: '15', title: 'The Cosmic Microwave Background', sub: 'A baby photo of the universe at 380,000 years',     ready: true },
  { id: 'bh',     n: '16', title: 'Anatomy of a Black Hole',       sub: 'Horizons, photon spheres, and Hawking evaporation',   ready: true },
  { id: 'sr',     n: '17', title: 'Special Relativity Essentials', sub: 'The Lorentz factor and what it does to spacetime',    ready: true },
  { id: 'sm',     n: '18', title: 'The Standard Model',             sub: 'The 17 particles that build everything we can see',   ready: true },
];

function StarField() {
  const stars = useMemo(() => Array.from({ length: 140 }, () => ({
    x: Math.random() * 100, y: Math.random() * 100, r: Math.random() * 1.2 + 0.2,
    o: Math.random() * 0.6 + 0.2, d: Math.random() * 4,
  })), []);
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {stars.map((s, i) => (
        <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill="#fff" opacity={s.o}
                className={i % 7 === 0 ? 'twinkle' : ''} style={{ animationDelay: `${s.d}s` }} />
      ))}
    </svg>
  );
}

function Hub({ onSelect, onShowPaths }) {
  return (
    <div className="min-h-screen relative grain overflow-hidden" style={{ background: BG, color: INK }}>
      <FontStyles />
      <StarField />
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-16">
        <div className="font-mono text-xs uppercase tracking-[0.3em] mb-4" style={{ color: ACCENT }}>
          An interactive primer · v0.9
        </div>
        <h1 className="font-display font-light text-6xl md:text-7xl leading-[1.0] mb-6 max-w-4xl" style={{ letterSpacing: '-0.025em' }}>
          Cosmos<br />
          <span style={{ fontStyle: 'italic', color: ACCENT }}>Explorer.</span>
        </h1>
        <p className="font-display text-lg md:text-xl max-w-3xl mb-8 leading-relaxed" style={{ color: '#c8c3b1' }}>
          A growing collection of interactive astrophysics primers — built at first-year-course depth,
          with real equations, derivations, and connections between topics. Each entry stands alone;
          taken together they form a curriculum.
        </p>

        <button onClick={onShowPaths}
          className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-4 py-3 rounded transition mb-12 hover:bg-white/5"
          style={{ color: ACCENT, border: `1px solid ${ACCENT}40` }}>
          <BookOpen size={14} /> Where should I start? · Learning paths
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px"
             style={{ background: BORDER }}>
          {TOPICS.map((t, idx) => (
            <button key={t.id} onClick={() => t.ready && onSelect(t.id)} disabled={!t.ready}
              className={`text-left p-7 md:p-8 transition-all group relative fade-in ${
                t.ready ? 'hover:bg-white/[0.03] cursor-pointer' : 'cursor-not-allowed'
              }`} style={{ background: BG, animationDelay: `${idx * 50}ms` }}>
              <div className="flex items-start justify-between mb-12">
                <span className="font-mono text-xs tracking-widest" style={{ color: DIM }}>{t.n}</span>
                {t.ready ? <Pill>open</Pill> : <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>soon</span>}
              </div>
              <h2 className="font-display text-2xl md:text-[26px] leading-tight mb-3"
                  style={{ color: t.ready ? INK : '#6a6757', letterSpacing: '-0.01em' }}>
                {t.title}
              </h2>
              <p className="font-display text-sm leading-relaxed" style={{ color: DIM }}>{t.sub}</p>
              {t.ready && (
                <div className="absolute bottom-7 right-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="font-mono text-xs" style={{ color: ACCENT }}>→</span>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-12 flex items-start gap-3 max-w-2xl">
          <Sparkles size={14} style={{ color: ACCENT, marginTop: 4 }} />
          <p className="font-mono text-xs leading-relaxed" style={{ color: DIM }}>
            Each topic is designed to be roughly one lecture's worth of material. Suggest any direction
            you want explored — gravitational lensing, the Saha equation, MHD basics, GR primer, whatever
            calls to you next.
          </p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  01 · H-R DIAGRAM (enhanced)
// ═══════════════════════════════════════════════════════════════════════════
function HRDiagram({ onBack }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [showRegions, setShowRegions] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [showRadius, setShowRadius] = useState(false);
  const [showTracks, setShowTracks] = useState(false);

  const W = 900, H = 600;
  const PL = 90, PR = 820, PT = 50, PB = 510;
  const PW = PR - PL, PH = PB - PT;
  const logT_min = Math.log10(2200), logT_max = Math.log10(45000);
  const logL_min = -5, logL_max = 7;
  const xT = t => PL + PW * (1 - (Math.log10(t) - logT_min) / (logT_max - logT_min));
  const yL = l => PT + PH * (1 - (Math.log10(l) - logL_min) / (logL_max - logL_min));

  // Stefan-Boltzmann: L/L☉ = (R/R☉)² (T/T☉)⁴
  // Lines of constant radius: log L = 2 log R + 4 log(T/5778)
  const constR = (R, t) => Math.pow(R, 2) * Math.pow(t / 5778, 4);
  const radiusLines = [0.01, 0.1, 1, 10, 100, 1000];

  // Evolutionary tracks (simplified, schematic but qualitatively correct)
  const tracks = [
    { mass: 1, color: '#fff4ea', points: [
      [5778, 1], [5500, 1.5], [5000, 3], [4500, 10], [4000, 50], [3500, 500], // RGB
      [4500, 50], [4800, 60], [4500, 200], [3500, 3000], // AGB
      [50000, 0.01], [25000, 0.001] // PN → WD
    ]},
    { mass: 5, color: '#cad7ff', points: [
      [17000, 600], [12000, 800], [8000, 1500], [5000, 2500], [4000, 4000], [3500, 6000]
    ]},
    { mass: 25, color: '#9bb0ff', points: [
      [38000, 80000], [30000, 100000], [25000, 130000], [15000, 180000], [8000, 250000], [4000, 300000], [3500, 350000]
    ]},
  ];

  const mainSeq = `
    M ${xT(40000)} ${yL(800000)} L ${xT(20000)} ${yL(20000)} L ${xT(10000)} ${yL(100)}
    L ${xT(6000)}  ${yL(1.5)}    L ${xT(4000)}  ${yL(0.1)}   L ${xT(2500)} ${yL(0.001)}
    L ${xT(2500)}  ${yL(0.0001)} L ${xT(4000)}  ${yL(0.01)}  L ${xT(6000)} ${yL(0.3)}
    L ${xT(10000)} ${yL(20)}     L ${xT(20000)} ${yL(3000)}  L ${xT(40000)} ${yL(100000)} Z`;
  const giants = `M ${xT(6000)} ${yL(10)} L ${xT(3000)} ${yL(20)} L ${xT(3000)} ${yL(2000)} L ${xT(6000)} ${yL(1000)} Z`;
  const supergiants = `M ${xT(40000)} ${yL(2000000)} L ${xT(3000)} ${yL(30000)} L ${xT(3000)} ${yL(1000000)} L ${xT(40000)} ${yL(5000000)} Z`;
  const whiteDwarfs = `M ${xT(35000)} ${yL(0.1)} L ${xT(5000)} ${yL(0.0001)} L ${xT(5000)} ${yL(0.00001)} L ${xT(35000)} ${yL(0.005)} Z`;

  const tempTicks = [40000, 20000, 10000, 7500, 6000, 5000, 3700, 2500];
  const lumTicks = [1e7, 1e5, 1e3, 10, 1, 0.01, 1e-4];
  const specBands = [
    { letter: 'O', t: 35000, c: '#9bb0ff' }, { letter: 'B', t: 17000, c: '#aabfff' },
    { letter: 'A', t: 8700, c: '#cad7ff' },  { letter: 'F', t: 6700, c: '#f8f7ff' },
    { letter: 'G', t: 5500, c: '#fff4ea' },  { letter: 'K', t: 4400, c: '#ffd2a1' },
    { letter: 'M', t: 3000, c: '#ffa070' },
  ];
  const active = hovered || selected;

  return (
    <PageShell onBack={onBack} eyebrow="07 — Stellar Properties"
               title={<>The <em style={{ color: ACCENT, fontStyle: 'italic' }}>H–R</em> Diagram</>}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div>
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {[
              ['regions', showRegions, setShowRegions],
              ['labels', showLabels, setShowLabels],
              ['radius lines', showRadius, setShowRadius],
              ['evol. tracks', showTracks, setShowTracks],
            ].map(([label, on, set]) => (
              <button key={label} onClick={() => set(!on)}
                className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-3 py-2 rounded transition"
                style={{ color: on ? ACCENT : DIM, border: `1px solid ${on ? ACCENT + '60' : BORDER}` }}>
                {on ? <Eye size={12} /> : <EyeOff size={12} />} {label}
              </button>
            ))}
          </div>

          <div className="relative" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {showRegions && (
                <g opacity="0.5">
                  <path d={mainSeq}     fill="#ffd591" opacity="0.06" />
                  <path d={giants}      fill="#ff8a70" opacity="0.07" />
                  <path d={supergiants} fill="#cad7ff" opacity="0.05" />
                  <path d={whiteDwarfs} fill="#aabfff" opacity="0.07" />
                </g>
              )}
              {showRegions && (
                <g fontFamily="JetBrains Mono, monospace" fontSize="11" fill={DIM} letterSpacing="0.15em">
                  <text x={xT(8000)} y={yL(0.3)} textAnchor="middle">MAIN SEQUENCE</text>
                  <text x={xT(3800)} y={yL(150)} textAnchor="middle">GIANTS</text>
                  <text x={xT(7000)} y={yL(300000)} textAnchor="middle">SUPERGIANTS</text>
                  <text x={xT(15000)} y={yL(0.008)} textAnchor="middle">WHITE DWARFS</text>
                </g>
              )}
              {/* Radius lines (constant R) */}
              {showRadius && (
                <g stroke={ACCENT2} strokeWidth="0.6" opacity="0.4" strokeDasharray="2 3" fill="none">
                  {radiusLines.map(R => {
                    const pts = [];
                    for (let logT = logT_min; logT <= logT_max; logT += 0.05) {
                      const t = Math.pow(10, logT);
                      const l = constR(R, t);
                      if (l >= Math.pow(10, logL_min) && l <= Math.pow(10, logL_max)) {
                        pts.push(`${xT(t)},${yL(l)}`);
                      }
                    }
                    return (
                      <g key={R}>
                        <polyline points={pts.join(' ')} />
                        {pts.length > 0 && (() => {
                          const [x, y] = pts[Math.floor(pts.length * 0.15)].split(',').map(Number);
                          return (
                            <text x={x} y={y - 4} fill={ACCENT2} fontSize="9" opacity="0.7">
                              R = {R < 1 ? R : R}R☉
                            </text>
                          );
                        })()}
                      </g>
                    );
                  })}
                </g>
              )}
              {/* Evolutionary tracks */}
              {showTracks && tracks.map(tr => (
                <g key={tr.mass}>
                  <polyline points={tr.points.map(([t, l]) => `${xT(t)},${yL(l)}`).join(' ')}
                            fill="none" stroke={tr.color} strokeWidth="1.5" opacity="0.7" strokeDasharray="3 2" />
                  {(() => {
                    const [t, l] = tr.points[tr.points.length - 1];
                    return (
                      <text x={xT(t) + 8} y={yL(l)} fill={tr.color} fontSize="10" fontFamily="JetBrains Mono, monospace">
                        {tr.mass} M☉ track
                      </text>
                    );
                  })()}
                </g>
              ))}
              {/* Grid */}
              <g stroke={BORDER} strokeWidth="0.5">
                {tempTicks.map(t => <line key={`v${t}`} x1={xT(t)} x2={xT(t)} y1={PT} y2={PB} />)}
                {lumTicks.map(l => <line key={`h${l}`} x1={PL} x2={PR} y1={yL(l)} y2={yL(l)} />)}
              </g>
              <line x1={PL} x2={PR} y1={PB} y2={PB} stroke={INK} />
              <line x1={PL} x2={PL} y1={PT} y2={PB} stroke={INK} />
              {/* Axis labels */}
              <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
                {tempTicks.map(t => (
                  <g key={`xt${t}`}>
                    <line x1={xT(t)} x2={xT(t)} y1={PB} y2={PB + 5} stroke={DIM} />
                    <text x={xT(t)} y={PB + 18} textAnchor="middle">{t >= 1000 ? `${t/1000}k` : t}</text>
                  </g>
                ))}
                <text x={(PL + PR) / 2} y={PB + 40} textAnchor="middle" fill={INK} letterSpacing="0.15em">SURFACE TEMPERATURE (K)</text>
                {specBands.map(b => (
                  <text key={b.letter} x={xT(b.t)} y={PT - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill={b.c}>{b.letter}</text>
                ))}
                {lumTicks.map(l => {
                  const exp = Math.log10(l);
                  return (
                    <g key={`yl${l}`}>
                      <line x1={PL - 5} x2={PL} y1={yL(l)} y2={yL(l)} stroke={DIM} />
                      <text x={PL - 10} y={yL(l) + 4} textAnchor="end">10{exp >= 0 ? '⁺' : '⁻'}{Math.abs(exp)}</text>
                    </g>
                  );
                })}
                <text x={PL - 60} y={(PT + PB) / 2} textAnchor="middle" fill={INK}
                      transform={`rotate(-90, ${PL - 60}, ${(PT + PB) / 2})`} letterSpacing="0.15em">
                  LUMINOSITY (L☉)
                </text>
              </g>
              {/* Sun crosshair */}
              <g opacity="0.4">
                <line x1={xT(5778)} x2={xT(5778)} y1={PT} y2={PB} stroke={ACCENT} strokeWidth="0.5" strokeDasharray="2 4" />
                <line x1={PL} x2={PR} y1={yL(1)} y2={yL(1)} stroke={ACCENT} strokeWidth="0.5" strokeDasharray="2 4" />
              </g>
              {/* Stars */}
              {STARS.map(s => {
                const cx = xT(s.temp), cy = yL(s.lum);
                const r = s.cls === 'WD' ? 3.5 : s.cls === 'SG' ? 7 : s.cls === 'G' ? 5.5 : 4.5;
                const isActive = active?.name === s.name;
                const isSelected = selected?.name === s.name;
                return (
                  <g key={s.name} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(null)}
                     onClick={() => setSelected(s)} style={{ cursor: 'pointer' }}>
                    {isActive && <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.6" />}
                    <circle cx={cx} cy={cy} r={r} fill={spectralColor(s.temp)} opacity={isActive ? 1 : 0.92}
                            stroke={isSelected ? ACCENT : 'none'} strokeWidth="1.5" />
                    {(showLabels || isActive) && (
                      <text x={cx + r + 4} y={cy + 3} fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK} opacity="0.85">
                        {s.name}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <p className="font-display text-sm leading-relaxed mt-5 max-w-3xl" style={{ color: '#c8c3b1' }}>
            Each star plotted by surface temperature and intrinsic luminosity (both on log scales).
            The dashed crosshair marks the Sun. Toggle <em>radius lines</em> to see lines of constant
            stellar radius (a direct consequence of Stefan–Boltzmann), and <em>evolutionary tracks</em>
            to see how stars of different masses migrate across the diagram during their lives.
          </p>

          {/* Below-diagram physics */}
          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>The physics behind the diagram</h3>

            <Section title="Why the main sequence is a line, not a cloud">
              <p>
                A main-sequence star is in hydrostatic equilibrium: outward pressure from nuclear burning
                in the core balances inward gravity. Both pressure and burning rate are set primarily by
                <em> mass</em>. So once you fix the mass, you fix the luminosity, temperature, and radius —
                hence the tight band.
              </p>
              <Eq>
                Mass–luminosity relation (rough, MS only):  L / L☉ ≈ (M / M☉)<sup>3.5</sup>
              </Eq>
              <p>
                A 10 M☉ star is about 10<sup>3.5</sup> ≈ 3,000 times more luminous than the Sun. It burns
                its hydrogen budget so fast that its main-sequence lifetime collapses to a few million years.
              </p>
              <Eq>
                Main-sequence lifetime:  t<sub>MS</sub> ≈ 10<sup>10</sup> (M / M☉)<sup>−2.5</sup> years
              </Eq>
            </Section>

            <Section title="Stefan–Boltzmann ties temperature, radius, and luminosity">
              <Eq>L = 4π R² σ T⁴</Eq>
              <p>
                Toggle the <em>radius lines</em> overlay. They run diagonally from upper-left to lower-right.
                Two stars at the same temperature but different luminosities must have different radii —
                that's why white dwarfs and supergiants sit far below and above the main sequence even
                though they share temperature ranges with main-sequence stars.
              </p>
            </Section>

            <Section title="How stars move across the diagram">
              <p>
                Stars do not slide along the main sequence as they age. Instead they spend ~90% of their
                lives in one spot on the main sequence, then move <em>off</em> it once hydrogen in the
                core is exhausted. Toggle evolutionary tracks to see the schematic paths for 1, 5, and 25 M☉.
              </p>
              <p>
                The 1 M☉ track ends as a white dwarf (after a planetary nebula). The 25 M☉ star never
                returns — it ends as a core-collapse supernova, leaving a neutron star or black hole.
              </p>
            </Section>

            <Section title="A note on the MK classification system">
              <p>
                Spectral types O, B, A, F, G, K, M run hot to cool. Each is subdivided 0–9 (G2 is hotter than
                G8). A Roman numeral indicates the luminosity class — V is main sequence (“dwarf”), III is a
                giant, I is a supergiant. The Sun is G2V; Betelgeuse is M1-2Ia.
              </p>
            </Section>

            <Playground
              title="Stellar diagnostic calculator"
              description="Drag the sliders to set any star's basic parameters and see what falls out — Stefan-Boltzmann radius and rough main-sequence lifetime."
              inputs={[
                { key: 'T', label: 'Surface temperature', default: 5778, min: 2500, max: 40000, step: 100, unit: 'K' },
                { key: 'L', label: 'Luminosity', default: 1, min: -4, max: 6, log: true, unit: 'L☉' },
                { key: 'M', label: 'Mass (assumes MS)', default: 1, min: -1, max: 2, log: true, unit: 'M☉' },
              ]}
              compute={(v) => {
                // L = 4π R² σ T⁴, in solar units: L/L☉ = (R/R☉)² (T/T☉)⁴
                const R = Math.sqrt(v.L / Math.pow(v.T / 5778, 4));
                const tMS = 1e10 * Math.pow(v.M, -2.5);
                const Lpredicted = Math.pow(v.M, 3.5);
                const spectralClass = spectralLetter(v.T);
                return {
                  R: R, tMS: tMS, Lpredicted: Lpredicted, spectralClass: spectralClass,
                };
              }}
              outputs={[
                { key: 'spectralClass', label: 'Spectral class', unit: '' },
                { key: 'R', label: 'Radius (Stefan-Boltzmann)', unit: 'R☉' },
                { key: 'Lpredicted', label: 'L predicted from M (MS)', unit: 'L☉' },
                { key: 'tMS', label: 'Main-sequence lifetime', unit: 'yr' },
              ]}
            />

            <WorkedExample title="Estimate the Sun's main-sequence lifetime"
                           steps={[
                             { text: 'The Sun fuses hydrogen into helium. Each conversion of four protons into one ⁴He releases ~26.7 MeV, of which ~2% is lost as neutrinos and the rest powers the Sun. Roughly 10% of the Sun\'s total hydrogen will be burned during its main-sequence life (only the core gets hot enough).',
                               eq: 'E_available = 0.10 × M☉ × X_H × 0.007 × c²' },
                             { text: 'X_H is the hydrogen mass fraction (≈0.71 for the Sun). The factor 0.007 is the fraction of rest mass converted to energy per hydrogen-to-helium conversion (∼26.7 MeV / ∼4 × 938 MeV/c²).',
                               eq: 'E_available ≈ 0.10 × (2 × 10³⁰ kg) × 0.71 × 0.007 × (3 × 10⁸ m/s)² ≈ 9 × 10⁴³ J' },
                             { text: 'Divide by the Sun\'s current luminosity to estimate the lifetime.',
                               eq: 't_MS = E_available / L☉ ≈ (9 × 10⁴³ J) / (3.8 × 10²⁶ W) ≈ 2.4 × 10¹⁷ s',
                               answer: '≈ 7.5 × 10⁹ years (about 7.5 Gyr), consistent with detailed stellar models that give ~10 Gyr. The Sun is currently ~4.6 Gyr old, so it\'s about halfway through its main-sequence life.' },
                           ]} />

            <Quiz questions={[
              { q: 'A star is hotter than the Sun but has the same luminosity. Compared to the Sun, it must be:',
                options: ['Larger', 'Smaller', 'Same size', 'More massive'],
                correct: 1,
                explain: 'From L = 4πR²σT⁴, if L is the same but T is higher, then R must be smaller. Hotter surface, smaller area, same total power. This is why hot subdwarfs and white dwarfs sit below the main sequence.' },
              { q: 'Which lives longest on the main sequence?',
                options: ['A 50 M☉ O star', 'A 1 M☉ G star like the Sun', 'A 0.3 M☉ M dwarf', 'They all live about the same time'],
                correct: 2,
                explain: 't_MS ∝ M / L ∝ M^(-2.5). A 0.3 M☉ red dwarf has a lifetime ~70× the Sun\'s — longer than the current age of the universe. No M dwarf has ever finished its main-sequence life by natural causes.' },
              { q: 'The position of a star on the HR diagram is set primarily by its:',
                options: ['Age', 'Composition', 'Mass (during MS)', 'Distance from Earth'],
                correct: 2,
                explain: 'During the main sequence, a star\'s mass nearly fully determines its luminosity and temperature (composition and rotation cause smaller variations). The HR diagram is, for MS stars, essentially a "mass spectrum."' },
            ]} />

            <OpenQuestions items={[
              { q: 'How exactly do convective and radiative transport interact in stars?',
                detail: 'Stellar interior models still use simple mixing-length theory for convection — a 1950s phenomenological model. 3D hydrodynamic simulations are revealing significant departures from this picture, especially near stellar surfaces. Getting this right matters for stellar ages, masses, and the helioseismology of the Sun.' },
              { q: 'What sets the upper mass limit of stars?',
                detail: 'Theoretical limits suggest ~150 M☉ should be the ceiling for stable stars (above this, radiation pressure tears them apart). But objects up to ~300 M☉ have been claimed observationally. How — and whether they\'re actually individual stars or unresolved multiples — is still debated.' },
              { q: 'Why does the Sun show a "lithium problem"?',
                detail: 'The Sun\'s photospheric lithium is depleted by ~200× compared to meteoritic abundance, far more than standard stellar models predict. The most likely cause is some form of mixing reaching deep enough to burn lithium, but the mechanism (rotation? convective overshoot? planet engulfment?) remains unclear.' },
            ]} />
          </div>
        </div>

        {/* Side panel */}
        <aside className="lg:sticky lg:top-6 self-start" style={{ borderLeft: `1px solid ${BORDER}` }}>
          <div className="pl-6">
            {selected ? (
              <div className="fade-in">
                <div className="flex items-start justify-between mb-4">
                  <Pill>selected · {selected.type}</Pill>
                  <button onClick={() => setSelected(null)} className="opacity-60 hover:opacity-100"><X size={14} /></button>
                </div>
                <h3 className="font-display text-3xl leading-tight mb-1" style={{ letterSpacing: '-0.01em' }}>{selected.name}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ background: spectralColor(selected.temp) }} />
                  <span className="font-mono text-xs" style={{ color: DIM }}>
                    Class {spectralLetter(selected.temp)} · {
                      selected.cls === 'MS' ? 'Main Sequence' : selected.cls === 'G' ? 'Giant' :
                      selected.cls === 'SG' ? 'Supergiant' : 'White Dwarf'
                    }
                  </span>
                </div>
                <dl className="space-y-3 mb-6">
                  <KV label="Temperature" value={`${selected.temp.toLocaleString()} K`} />
                  <KV label="Luminosity" value={`${fmtSci(selected.lum)} L☉`} />
                  <KV label="Radius" value={`${selected.radius} R☉`} />
                  <KV label="Mass" value={`${selected.mass} M☉`} />
                  <KV label="Distance" value={selected.dist < 0.001 ? '~8 light-min' : `${selected.dist} ly`} />
                  {selected.cls === 'MS' && (
                    <KV label="Est. MS lifetime"
                        value={`${fmtSci(1e10 * Math.pow(selected.mass, -2.5), 1)} yr`} />
                  )}
                </dl>
                <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{selected.fact}</div>
              </div>
            ) : (
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: DIM }}>
                  How to read this chart
                </div>
                <ul className="space-y-4 font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>
                  <li><span style={{ color: ACCENT }}>Left → right:</span> stars get cooler. Historically built this way and never re-flipped.</li>
                  <li><span style={{ color: ACCENT }}>Bottom → top:</span> luminosity rises by factors of ten per grid line.</li>
                  <li><span style={{ color: ACCENT }}>The diagonal band</span> is the main sequence — ~90% of a star’s life.</li>
                  <li><span style={{ color: ACCENT }}>Off the band:</span> young, dying, or already a remnant.</li>
                </ul>
                <div className="mt-6 pt-6 font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: DIM, borderTop: `1px solid ${BORDER}` }}>
                  Click any star to inspect
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  02 · STELLAR SIZE COMPARISON
// ═══════════════════════════════════════════════════════════════════════════
const SIZE_FRAMES = [
  { title: 'Earth & the inner worlds', subtitle: 'Setting our scale. Earth is the unit.',
    note: 'Earth has radius 6,371 km and mass 5.97×10²⁴ kg. Every quantity on this tour is referenced back to it.',
    unit: 'Earth radii', bodies: [
      { name: 'Mercury', r: 0.383, color: '#c8b8a0' }, { name: 'Mars', r: 0.532, color: '#cd5c3c' },
      { name: 'Venus', r: 0.949, color: '#e6c889' }, { name: 'Earth', r: 1, color: '#4d8edc' },
    ]},
  { title: 'The gas giants', subtitle: 'Jupiter holds 11 Earths across its diameter.',
    note: 'Jupiter is a “failed star” — mostly hydrogen and helium, but ~80× too light to ignite fusion. The minimum mass for hydrogen fusion is ~0.08 M☉ (~85 Jupiter masses).',
    unit: 'Earth radii', bodies: [
      { name: 'Earth', r: 1, color: '#4d8edc' }, { name: 'Neptune', r: 3.88, color: '#5b8cb0' },
      { name: 'Saturn', r: 9.45, color: '#e4c794' }, { name: 'Jupiter', r: 11.21, color: '#d3a87a' },
    ]},
  { title: 'Enter the Sun', subtitle: '109 Earths across. Jupiter is a marble.',
    note: 'The Sun is 1.989×10³⁰ kg, 99.8% of all the mass in our solar system. Its core fuses ~600 million tonnes of hydrogen into helium every second.',
    unit: 'Earth radii', bodies: [
      { name: 'Earth', r: 1, color: '#4d8edc' }, { name: 'Jupiter', r: 11.21, color: '#d3a87a' },
      { name: 'Sun', r: 109, color: '#fff4ea' },
    ]},
  { title: 'The Sun among its neighbours', subtitle: 'Switching to solar radii. The Sun is now the unit.',
    note: 'Main-sequence stars span a factor of ~15 in radius and ~10⁹ in luminosity. The Sun is comfortably mid-range — neither big nor bright by stellar standards.',
    unit: 'Solar radii', bodies: [
      { name: 'Proxima', r: 0.154, color: '#ffa070' }, { name: 'Sun', r: 1, color: '#fff4ea' },
      { name: 'Sirius A', r: 1.71, color: '#cad7ff' }, { name: 'Vega', r: 2.36, color: '#cad7ff' },
    ]},
  { title: 'Red giants', subtitle: 'A glimpse of the Sun’s future.',
    note: 'When a Sun-like star exhausts core hydrogen, it swells. The Sun will reach ~170 R☉ on the red giant branch, then briefly contract during helium core burning, then swell to ~1 AU on the asymptotic giant branch — engulfing Mercury and Venus.',
    unit: 'Solar radii', bodies: [
      { name: 'Sun', r: 1, color: '#fff4ea' }, { name: 'Arcturus', r: 25.4, color: '#ffd2a1' },
      { name: 'Aldebaran', r: 45.1, color: '#ffa070' },
    ]},
  { title: 'Supergiants', subtitle: 'The end-of-life forms of massive stars.',
    note: 'Betelgeuse at the Sun’s position would extend past Mars and into the asteroid belt. Despite their volume, supergiants are extraordinarily diffuse — average density of Betelgeuse is ~10⁻⁸ kg/m³, less than the best laboratory vacuum.',
    unit: 'Solar radii', bodies: [
      { name: 'Sun', r: 1, color: '#fff4ea' }, { name: 'Rigel', r: 78.9, color: '#cad7ff' },
      { name: 'Antares', r: 680, color: '#ffa070' }, { name: 'Betelgeuse', r: 887, color: '#ffa070' },
    ]},
  { title: 'Hypergiants', subtitle: 'The largest known stars.',
    note: 'VY Canis Majoris and UY Scuti push ~1400–1700 R☉. Stars this size are unstable — they shed enormous mass-loss winds and live perhaps a few million years before exploding. Place VY CMa at the Sun: light would take ~6 hours to cross from one side to the other.',
    unit: 'Solar radii', bodies: [
      { name: 'Sun', r: 1, color: '#fff4ea' }, { name: 'Betelgeuse', r: 887, color: '#ffa070' },
      { name: 'VY CMa', r: 1420, color: '#ff8060' },
    ]},
];

function SizeComparison({ onBack }) {
  const [step, setStep] = useState(0);
  const frame = SIZE_FRAMES[step];
  const W = 900, H = 520;
  const maxR = Math.max(...frame.bodies.map(b => b.r));
  const totalUnits = frame.bodies.reduce((s, b) => s + b.r * 2, 0);
  const gaps = (frame.bodies.length - 1) * (maxR * 0.18);
  const scale = (W - 80) / (totalUnits + gaps);
  let cursor = 40;
  const positioned = frame.bodies.map(b => {
    const diam = b.r * 2 * scale;
    const cx = cursor + diam / 2;
    cursor += diam + maxR * 0.18 * scale;
    return { ...b, cx, cy: H / 2 + 40, rPx: b.r * scale };
  });

  return (
    <PageShell onBack={onBack} eyebrow="04 — Stellar Size Comparison"
               title={<>A walk up the <em style={{ color: ACCENT, fontStyle: 'italic' }}>ladder of scale</em></>}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        <div>
          <div className="flex items-center gap-2 mb-6">
            {SIZE_FRAMES.map((_, i) => (
              <button key={i} onClick={() => setStep(i)} className="flex-1 h-0.5 transition-all"
                style={{ background: i <= step ? ACCENT : BORDER, opacity: i === step ? 1 : 0.6 }} />
            ))}
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
              Step {step + 1} of {SIZE_FRAMES.length}
            </div>
            <div className="font-mono text-xs" style={{ color: DIM }}>
              Unit: 1 {frame.unit.replace(/s$/, '')}
            </div>
          </div>

          <h2 className="font-display text-3xl mb-2 leading-tight" style={{ letterSpacing: '-0.01em' }}>{frame.title}</h2>
          <p className="font-display text-lg italic mb-6" style={{ color: '#c8c3b1' }}>{frame.subtitle}</p>

          <div className="relative" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              <defs>
                {positioned.map((b, i) => (
                  <radialGradient key={i} id={`g-${step}-${i}`} cx="35%" cy="35%">
                    <stop offset="0%" stopColor={b.color} stopOpacity="1" />
                    <stop offset="60%" stopColor={b.color} stopOpacity="0.85" />
                    <stop offset="100%" stopColor={b.color} stopOpacity="0.55" />
                  </radialGradient>
                ))}
              </defs>
              <line x1="40" x2={W-40} y1={H/2 + 40} y2={H/2 + 40} stroke={BORDER} strokeDasharray="3 6" />
              {positioned.map((b, i) => (
                <g key={b.name} className="fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <circle cx={b.cx} cy={b.cy} r={b.rPx * 1.15} fill={b.color} opacity="0.08" />
                  <circle cx={b.cx} cy={b.cy} r={b.rPx} fill={`url(#g-${step}-${i})`} />
                  <line x1={b.cx} x2={b.cx} y1={b.cy + b.rPx + 4} y2={b.cy + b.rPx + 16} stroke={DIM} />
                  <text x={b.cx} y={b.cy + b.rPx + 32} textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace" fontSize="11" fill={INK}>{b.name}</text>
                  <text x={b.cx} y={b.cy + b.rPx + 46} textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>
                    {b.r < 0.01 ? b.r.toFixed(3) : b.r < 1 ? b.r.toFixed(2) : b.r.toFixed(b.r < 10 ? 1 : 0)} {frame.unit.includes('Earth') ? 'R⊕' : 'R☉'}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                    className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-4 py-3 rounded transition disabled:opacity-30"
                    style={{ color: INK, border: `1px solid ${BORDER}` }}>
              <ChevronLeft size={14} /> previous
            </button>
            <button onClick={() => setStep(Math.min(SIZE_FRAMES.length - 1, step + 1))}
                    disabled={step === SIZE_FRAMES.length - 1}
                    className="font-mono text-xs uppercase tracking-widest flex items-center gap-2 px-4 py-3 rounded transition disabled:opacity-30"
                    style={{ color: BG, background: ACCENT }}>
              next <ChevronRight size={14} />
            </button>
          </div>

          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <Section title="A useful intuition about density">
              <p>
                Bigger does not mean denser. A red giant like Betelgeuse has average density ~10⁻⁸ kg/m³ —
                near vacuum. A white dwarf is ~10⁹ kg/m³ (a million times water). A neutron star is
                ~10¹⁷ kg/m³ — roughly the density of an atomic nucleus.
              </p>
              <Eq>ρ̄ = M / (⁴⁄₃ π R³)</Eq>
              <p>
                The four most important stellar end-states span 25 orders of magnitude in density:
                main-sequence Sun (~10³), red giant (~10⁻⁸), white dwarf (~10⁹), neutron star (~10¹⁷), black hole singularity (formally infinite).
              </p>
            </Section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start" style={{ borderLeft: `1px solid ${BORDER}` }}>
          <div className="pl-6 fade-in" key={step}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>Why this matters</div>
            <p className="font-display text-base leading-relaxed mb-6" style={{ color: '#c8c3b1' }}>{frame.note}</p>
            <div className="pt-6 font-mono text-[10px] uppercase tracking-[0.2em] leading-relaxed" style={{ color: DIM, borderTop: `1px solid ${BORDER}` }}>
              Diameters are scaled within each step. Between steps the scale changes — that’s the only way to fit Earth and a hypergiant on one screen.
            </div>
          </div>
        </aside>
      </div>

      <Playground
        title="Compare any two objects"
        description="The biggest stars are 10⁹ × larger by volume than Earth. Use this to feel the ratios across the universe of sizes. Inputs in any unit (Earth radii, solar radii, AU, light-years) translate freely."
        inputs={[
          { key: 'rA', label: 'Object A radius', default: 1, min: -2, max: 9, log: true, unit: 'R☉' },
          { key: 'rB', label: 'Object B radius', default: 109, min: -2, max: 9, log: true, unit: 'R☉' },
        ]}
        compute={(v) => {
          const ratio = v.rB / v.rA;
          const volRatio = Math.pow(ratio, 3);
          const rA_km = v.rA * 6.957e5;
          const rB_km = v.rB * 6.957e5;
          const lightCross_A = (2 * rA_km) / 299792.458;
          const lightCross_B = (2 * rB_km) / 299792.458;
          return { ratio, volRatio, rA_km, rB_km, lightCross_A, lightCross_B };
        }}
        outputs={[
          { key: 'ratio', label: 'B / A diameter ratio', unit: '×' },
          { key: 'volRatio', label: 'B / A volume ratio', unit: '×' },
          { key: 'rA_km', label: 'Radius of A', unit: 'km' },
          { key: 'rB_km', label: 'Radius of B', unit: 'km' },
          { key: 'lightCross_A', label: 'Light-crossing time A (diameter)', unit: 's' },
          { key: 'lightCross_B', label: 'Light-crossing time B (diameter)', unit: 's' },
        ]}
      />

      <Section title="A useful intuition: light-crossing times">
        <p>
          One way to grasp astronomical sizes is asking how long light takes to cross them. The Sun
          is ~4.6 light-seconds across. Earth is ~0.04 light-seconds. Jupiter is ~1 light-second. The
          solar system out to Neptune is ~8 light-hours across. The Milky Way is ~100,000 light-years.
        </p>
        <p>
          Light-crossing time has physical meaning beyond cute units — it sets the fastest possible
          response time of any astrophysical object. A variable star or AGN that brightens in ~1 hour
          must be smaller than ~1 light-hour (~10⁹ km) across, otherwise different parts couldn't
          synchronise the brightening fast enough. This is how we first knew the X-ray emission regions
          near supermassive black holes had to be tiny.
        </p>
      </Section>

      <Quiz questions={[
        { q: 'The Sun\'s diameter is about 109× Earth\'s. How many Earths would fit inside the Sun by volume?',
          options: ['~100', '~10,000', '~1.3 million', '~100 million'],
          correct: 2,
          explain: 'Volume scales as the cube of the radius. (109)³ ≈ 1.3 million. The Sun could contain about 1.3 million Earths by volume — though only ~330,000 Earths by mass, because the Sun is much less dense on average than Earth.' },
        { q: 'Why are red supergiants so much larger than the Sun despite having only ~10–20× more mass?',
          options: ['They have more hydrogen', 'They are heated externally', 'Late-stage shell burning hugely inflates the envelope', 'They rotate faster'],
          correct: 2,
          explain: 'After core hydrogen exhaustion, massive stars develop a hot core surrounded by hydrogen-burning shells. The intense shell luminosity inflates the outer envelope by orders of magnitude. Betelgeuse with ~17 M☉ is now ~900× the Sun\'s radius — its volume is ~700 million times the Sun\'s.' },
        { q: 'Place these in correct order from smallest to largest by physical size:',
          options: [
            'Earth → Jupiter → Sun → Sirius → Betelgeuse',
            'Earth → Sirius → Jupiter → Sun → Betelgeuse',
            'Earth → Sun → Jupiter → Sirius → Betelgeuse',
            'Jupiter → Earth → Sun → Sirius → Betelgeuse',
          ],
          correct: 0,
          explain: 'Earth (R = 1) → Jupiter (R = 11) → Sun (R = 109) → Sirius A (R = 192, A-type MS) → Betelgeuse (R ≈ 96,500, red supergiant). The size jump from Sun to Betelgeuse is roughly the same order of magnitude as Earth to Sun.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  03 · STELLAR LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════
function lifeForMass(M) {
  // Returns array of phases with name, duration, description, color
  const tMS = 1e10 * Math.pow(M, -2.5); // years
  if (M < 0.08) return {
    fate: 'Brown dwarf', endColor: '#a06848',
    summary: `Below ~0.08 M☉ the core never gets hot enough (~3×10⁶ K) to sustain hydrogen fusion. Object slowly contracts and cools forever.`,
    phases: [
      { name: 'Collapsing cloud', dur: 'Myr', col: '#3a4a6a', desc: 'Gravitational contraction.' },
      { name: 'Brown dwarf', dur: 'Eternal cooling', col: '#a06848', desc: 'Deuterium burning briefly (~10–50 Myr), then pure cooling forever.' },
    ]
  };
  if (M < 0.5) return {
    fate: 'Helium white dwarf (eventually)', endColor: '#cad7ff',
    summary: `Below ~0.5 M☉ the star is fully convective. It burns hydrogen extraordinarily slowly via the pp chain and never develops a helium-burning core. Its MS lifetime exceeds the current age of the universe — no red dwarf has ever died of natural causes.`,
    phases: [
      { name: 'Protostar', dur: '~100 Myr', col: '#3a4a6a', desc: 'Kelvin–Helmholtz contraction; ignites pp-chain.' },
      { name: 'Red dwarf MS', dur: `~${fmtSci(tMS, 1)} yr`, col: '#ffa070', desc: 'Hydrogen fusion via pp chain. Fully convective interior keeps mixing fresh fuel into the core.' },
      { name: 'Eventual He WD', dur: '—', col: '#cad7ff', desc: 'Will eventually contract to a helium white dwarf — but no such star has existed long enough to do so.' },
    ]
  };
  if (M < 8) return {
    fate: 'C/O white dwarf', endColor: '#cad7ff',
    summary: `Sun-like and intermediate-mass stars. Burn hydrogen on the MS, then ascend the red giant branch, burn helium in the core, climb the asymptotic giant branch, expel a planetary nebula, and leave behind a carbon-oxygen white dwarf supported by electron degeneracy pressure.`,
    phases: [
      { name: 'Protostar', dur: '~1–30 Myr', col: '#3a4a6a', desc: 'Pre-MS contraction along the Hayashi track.' },
      { name: 'Main sequence', dur: `~${fmtSci(tMS, 1)} yr`, col: '#fff4ea', desc: 'Hydrogen → helium in the core via pp chain (Sun-like) or CNO cycle (heavier).' },
      { name: 'Red giant branch', dur: '~1 Gyr × (M/M☉)⁻²', col: '#ffa070', desc: 'H-shell burning around a contracting He core. Envelope swells dramatically.' },
      { name: 'Helium flash → HB', dur: '~100 Myr', col: '#ffd2a1', desc: 'Helium ignites in degenerate core (flash), then settles to stable helium burning on the horizontal branch.' },
      { name: 'AGB / planetary nebula', dur: '~10 Myr', col: '#ffa070', desc: 'Thermal pulses, heavy mass loss, dust formation. Outer envelope expelled.' },
      { name: 'C/O white dwarf', dur: 'Cools forever', col: '#cad7ff', desc: 'Earth-sized; ~0.6 M☉; supported by electron degeneracy pressure. Cools over ~10¹³ yr.' },
    ]
  };
  if (M < 25) return {
    fate: 'Neutron star', endColor: '#aabfff',
    summary: `Massive stars burn through hydrogen, helium, carbon, neon, oxygen, and silicon in nested shells. The iron core that builds up cannot release fusion energy. When it exceeds the Chandrasekhar limit (~1.4 M☉) it collapses in <1 second — triggering a Type II supernova and leaving a neutron star.`,
    phases: [
      { name: 'Protostar', dur: '~10⁵ yr', col: '#3a4a6a', desc: 'Rapid pre-MS contraction.' },
      { name: 'O/B main sequence', dur: `~${fmtSci(tMS, 1)} yr`, col: '#aabfff', desc: 'Hot, blue, luminous. Hydrogen burning via CNO cycle.' },
      { name: 'Blue/red supergiant', dur: '~Myr', col: '#ffa070', desc: 'Helium, carbon, neon, oxygen, silicon burning — each stage shorter than the last.' },
      { name: 'Core collapse / Type II SN', dur: 'Seconds', col: '#ffc97a', desc: 'Iron core implodes; ~99% of energy escapes as neutrinos; ~1% drives a shockwave.' },
      { name: 'Neutron star', dur: 'Slow cooling', col: '#aabfff', desc: '~1.4 M☉ packed into ~20 km. Density ~10¹⁷ kg/m³. Supported by neutron degeneracy pressure.' },
    ]
  };
  return {
    fate: 'Black hole', endColor: '#2a2a3a',
    summary: `For initial masses above ~25 M☉ the iron core exceeds the Tolman–Oppenheimer–Volkoff limit (~2–3 M☉ at collapse). Neutron degeneracy cannot stop the implosion. Result: a black hole, sometimes with a “failed supernova” (no visible explosion). Above ~40 M☉ direct collapse becomes likely.`,
    phases: [
      { name: 'Protostar', dur: '~10⁴ yr', col: '#3a4a6a', desc: 'Extremely rapid contraction.' },
      { name: 'O-type main sequence', dur: `~${fmtSci(tMS, 1)} yr`, col: '#9bb0ff', desc: 'Hot UV-luminous star. Strong stellar winds shed ~10⁻⁵ M☉/yr.' },
      { name: 'Wolf–Rayet phase', dur: '~10⁵ yr', col: '#fff4ea', desc: 'Hydrogen envelope stripped by winds; helium core exposed.' },
      { name: 'Core collapse', dur: 'Seconds', col: '#ffc97a', desc: 'May produce a luminous supernova or “fail” (collapse silently to BH).' },
      { name: 'Black hole', dur: 'Effectively eternal', col: '#2a2a3a', desc: 'Stellar-mass BH, typically 5–80 M☉ depending on metallicity and rotation. Hawking lifetime ~10⁶⁷ yr.' },
    ]
  };
}

function StellarLifecycle({ onBack }) {
  const [logM, setLogM] = useState(0); // log10(M/M☉), so 0 = solar
  const M = Math.pow(10, logM);
  const life = lifeForMass(M);
  const tMS = 1e10 * Math.pow(M, -2.5);

  // Mass markers for slider
  const markers = [
    { m: 0.05, label: '0.05' }, { m: 0.5, label: '0.5' }, { m: 1, label: '1' },
    { m: 8, label: '8' }, { m: 25, label: '25' }, { m: 100, label: '100' },
  ];

  return (
    <PageShell onBack={onBack} eyebrow="08 — Stellar Evolution"
               title={<>The <em style={{ color: ACCENT, fontStyle: 'italic' }}>Lifecycle</em> of a Star</>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Set the initial mass and watch the entire arc of the star’s life rewrite itself. Mass is the
        single most important parameter — it determines luminosity, temperature, lifetime, and ultimate fate.
      </p>

      {/* Mass slider */}
      <div className="mb-10 p-6 rounded" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
        <div className="flex justify-between items-baseline mb-3">
          <div className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: ACCENT }}>Initial mass</div>
          <div className="font-display text-3xl" style={{ letterSpacing: '-0.01em' }}>
            {M < 0.1 ? M.toFixed(3) : M < 1 ? M.toFixed(2) : M < 10 ? M.toFixed(1) : Math.round(M)} <span className="font-mono text-base" style={{ color: DIM }}>M☉</span>
          </div>
        </div>
        <input type="range" min={-1.3} max={2.1} step={0.01} value={logM}
               onChange={e => setLogM(parseFloat(e.target.value))} className="w-full" />
        <div className="flex justify-between mt-2 relative h-6">
          {markers.map(m => {
            const pct = (Math.log10(m.m) - (-1.3)) / (2.1 - (-1.3)) * 100;
            return (
              <button key={m.label} onClick={() => setLogM(Math.log10(m.m))}
                      className="absolute font-mono text-[10px] hover:text-white transition"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)', color: DIM }}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          {/* Key facts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-8" style={{ background: BORDER }}>
            {[
              ['Initial mass', `${fmt(M)} M☉`],
              ['MS lifetime', `${fmtSci(tMS, 1)} yr`],
              ['MS luminosity', `${fmtSci(Math.pow(M, 3.5), 1)} L☉`],
              ['End state', life.fate],
            ].map(([label, val]) => (
              <div key={label} className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>{label}</div>
                <div className="font-display text-lg" style={{ color: INK, letterSpacing: '-0.01em' }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Phases as a horizontal timeline */}
          <div className="mb-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>The path</div>
            <div className="space-y-2">
              {life.phases.map((p, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded fade-in"
                     style={{ background: PANEL, border: `1px solid ${BORDER}`, animationDelay: `${i * 60}ms` }}>
                  <div className="flex flex-col items-center pt-1" style={{ minWidth: 30 }}>
                    <div className="w-3 h-3 rounded-full" style={{ background: p.col }} />
                    {i < life.phases.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: BORDER, minHeight: 30 }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="font-display text-lg" style={{ color: INK, letterSpacing: '-0.01em' }}>{p.name}</div>
                      <div className="font-mono text-xs" style={{ color: DIM }}>{p.dur}</div>
                    </div>
                    <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Physics */}
          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>The physics that sets a star’s fate</h3>

            <Section title="Mass alone (almost) decides everything">
              <p>
                Two stars of the same initial mass and composition will follow nearly identical paths.
                Composition matters at the ~10–20% level; rotation and binarity matter for a fraction of
                stars; but for a first approximation, mass is destiny.
              </p>
            </Section>

            <Section title="Two critical mass thresholds">
              <p>
                <strong style={{ color: ACCENT }}>~0.08 M☉</strong> — the hydrogen-burning limit. Below this
                the core never reaches ~3×10⁶ K and no sustained fusion ignites. Object is a brown dwarf.
              </p>
              <p>
                <strong style={{ color: ACCENT }}>~8 M☉</strong> — the supernova threshold. Below this the
                core never reaches temperatures needed to burn carbon (~6×10⁸ K). Star dies as a white dwarf.
                Above this it climbs the ladder of nuclear burning all the way to iron and dies in a supernova.
              </p>
              <p>
                <strong style={{ color: ACCENT }}>~25 M☉</strong> — the black hole threshold. Above this the
                collapsing core is too massive for neutron degeneracy pressure to halt it.
              </p>
            </Section>

            <Section title="The Chandrasekhar limit — a beautiful piece of physics">
              <Eq>M<sub>Ch</sub> ≈ 1.4 M☉</Eq>
              <p>
                Electron degeneracy pressure can support a stellar remnant only up to ~1.4 M☉. Above this,
                electrons would need to move faster than light. The limit was derived by Subrahmanyan Chandrasekhar
                in 1930 — at age 19, on a ship from India to Cambridge — by combining quantum mechanics and special
                relativity. It is the reason white dwarfs are never more massive than ~1.4 M☉.
              </p>
              <p>
                For neutron stars, the analogous (less precisely known) Tolman–Oppenheimer–Volkoff limit sits
                around 2–3 M☉. Above that, even neutron degeneracy fails — and you get a black hole.
              </p>
            </Section>

            <Section title="Why massive stars live shorter lives">
              <p>
                It seems counterintuitive: a star with 25 times the fuel should last longer than the Sun, not
                shorter. But a 25 M☉ star is ~10⁵ times more luminous than the Sun. It burns through its fuel
                ~4,000 times faster than it has more of it. Massive stars are profligate.
              </p>
              <Eq>t<sub>MS</sub> ∝ M / L ∝ M / M<sup>3.5</sup> = M<sup>−2.5</sup></Eq>
            </Section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start" style={{ borderLeft: `1px solid ${BORDER}` }}>
          <div className="pl-6 fade-in" key={Math.round(logM * 10)}>
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>
              Summary
            </div>
            <p className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>
              {life.summary}
            </p>
            <div className="mt-6 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] leading-relaxed" style={{ color: DIM, borderTop: `1px solid ${BORDER}` }}>
              Try the markers: 0.5 (red dwarf · eternal), 1 (Sun · WD), 8 (boundary), 25 (NS/BH boundary).
            </div>
          </div>
        </aside>
      </div>

      <Playground
        title="Stellar lifetime calculator"
        description="Massive stars burn brilliantly but briefly. The relation t ∝ M⁻²·⁵ comes from t = (fuel/burn rate) and L ∝ M³·⁵ for main-sequence stars. Adjust the mass to see how lifetime collapses with increasing mass."
        inputs={[
          { key: 'M', label: 'Stellar mass', default: 1, min: -1, max: 2.2, log: true, unit: 'M☉' },
        ]}
        compute={(v) => {
          const tMS = 1e10 * Math.pow(v.M, -2.5);
          const L = Math.pow(v.M, 3.5);
          const T_surf = 5778 * Math.pow(v.M, 0.5);
          let fate;
          if (v.M < 0.08) fate = 'Brown dwarf';
          else if (v.M < 0.5) fate = 'White dwarf (He core)';
          else if (v.M < 8) fate = 'White dwarf (C/O core) via planetary nebula';
          else if (v.M < 25) fate = 'Neutron star via Type II SN';
          else fate = 'Black hole';
          const tMS_compare = tMS / 4.6e9;
          return { tMS, L, T_surf, fate, tMS_compare };
        }}
        outputs={[
          { key: 'fate', label: 'Final fate', unit: '' },
          { key: 'L', label: 'MS luminosity', unit: 'L☉' },
          { key: 'T_surf', label: 'Approx surface temperature', unit: 'K' },
          { key: 'tMS', label: 'Main-sequence lifetime', unit: 'yr' },
          { key: 'tMS_compare', label: 'In Sun-lifetimes (~4.6 Gyr)', unit: '×' },
        ]}
      />

      <Section title="The five gateways">
        <p>
          Watching the slider, notice five sharp boundaries where the fate changes qualitatively:
        </p>
        <p>
          <strong style={{ color: ACCENT }}>0.08 M☉</strong> — minimum mass for hydrogen fusion (the "stellar threshold"). Below this, brown dwarfs.<br/>
          <strong style={{ color: ACCENT }}>0.5 M☉</strong> — minimum mass to ignite helium fusion. Below this, the helium core is supported by electron degeneracy and the star can never reach the temperatures needed.<br/>
          <strong style={{ color: ACCENT }}>8 M☉</strong> — approximate boundary between white-dwarf endpoints and neutron-star/supernova endpoints. Stars above this can ignite carbon and beyond.<br/>
          <strong style={{ color: ACCENT }}>~25 M☉</strong> — approximate threshold between neutron star and black hole formation. Above this, the iron core typically exceeds the Tolman–Oppenheimer–Volkoff limit.<br/>
          <strong style={{ color: ACCENT }}>~150 M☉</strong> — theoretical upper limit for stable stars (radiation pressure unbinds anything heavier). Observationally, ~300 M☉ objects have been claimed but are debated.
        </p>
      </Section>

      <Quiz questions={[
        { q: 'A star with mass 8 M☉ has a main-sequence lifetime roughly:',
          options: ['Same as the Sun (~10 Gyr)', '~10× longer than the Sun', '~50× shorter than the Sun (~200 Myr)', '~1000× shorter than the Sun (~10 Myr)'],
          correct: 2,
          explain: 't ∝ M^(-2.5). For M = 8: t = 10^10 × 8^(-2.5) ≈ 10^10 / 180 ≈ 55 Myr. So roughly 200× shorter — but the closest answer is "~50× shorter". The 8 M☉ stars near the threshold for core collapse live only a few hundred million years.' },
        { q: 'Why can\'t a red dwarf become a giant?',
          options: ['Not enough fuel', 'Cores are fully convective — they don\'t develop a separate inert He core', 'Surrounded by too much dust', 'They explode first'],
          correct: 1,
          explain: 'Red dwarfs below ~0.35 M☉ are fully convective: hydrogen is mixed throughout, not just in the core. So they consume essentially all their hydrogen (not just the core\'s) before changing. The fully convective interior also means no inert helium core can build up. Result: they fade directly to helium white dwarfs without ever becoming giants.' },
        { q: 'A 1.4 M☉ white dwarf accretes mass from a binary companion. When it reaches what mass does it explode?',
          options: ['Immediately at 1.4 M☉', 'Never; the companion limits transfer', '~1.4 M☉ — the Chandrasekhar limit', '~3 M☉ — the TOV limit'],
          correct: 2,
          explain: 'When a CO white dwarf reaches the Chandrasekhar limit (~1.4 M☉), electron degeneracy can no longer support it. Carbon ignition deep in the core triggers a runaway thermonuclear reaction — a Type Ia supernova, completely disrupting the star with no remnant. This is the standardisable candle that revealed dark energy in 1998.' },
      ]} />

      <OpenQuestions items={[
        { q: 'What is the maximum mass for a single star?',
          detail: '— Theory says ~150 M☉ at solar metallicity (above that, radiation pressure expels the envelope). Yet objects of ~300 M☉ have been claimed in 30 Doradus and elsewhere. Whether these are single stars, unresolved binaries, or recent stellar mergers remains debated.' },
        { q: 'How do the most massive black holes form from stellar collapse?',
          detail: '— Standard models predict a "mass gap" between ~50–130 M☉ where pair-instability supernovae should obliterate the star (no remnant). Yet LIGO has detected several mergers involving black holes squarely in this gap (e.g. GW190521, with components ~85 + 66 M☉). Either pair-instability theory is incomplete, or these BHs formed via hierarchical mergers in dense clusters.' },
        { q: 'How important is binary evolution to massive-star fates?',
          detail: '— Over 70% of O-stars are in binaries close enough to interact during their lives. Mass transfer, common-envelope phases, and stellar mergers fundamentally alter evolution. The "single-star" tracks taught in textbooks may apply to only ~30% of massive stars.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  04 · NUCLEAR FUSION
// ═══════════════════════════════════════════════════════════════════════════
// Binding energy per nucleon for common isotopes (MeV)
const BE_DATA = [
  { A: 1, name: '¹H', be: 0 },        { A: 2, name: '²H', be: 1.11 },
  { A: 3, name: '³He', be: 2.57 },    { A: 4, name: '⁴He', be: 7.07 },
  { A: 6, name: '⁶Li', be: 5.33 },    { A: 7, name: '⁷Li', be: 5.61 },
  { A: 9, name: '⁹Be', be: 6.46 },    { A: 12, name: '¹²C', be: 7.68 },
  { A: 14, name: '¹⁴N', be: 7.48 },   { A: 16, name: '¹⁶O', be: 7.98 },
  { A: 20, name: '²⁰Ne', be: 8.03 },  { A: 24, name: '²⁴Mg', be: 8.26 },
  { A: 28, name: '²⁸Si', be: 8.45 },  { A: 32, name: '³²S', be: 8.49 },
  { A: 40, name: '⁴⁰Ca', be: 8.55 },  { A: 56, name: '⁵⁶Fe', be: 8.79 },
  { A: 84, name: '⁸⁴Kr', be: 8.72 },  { A: 119, name: '¹¹⁹Sn', be: 8.50 },
  { A: 168, name: '¹⁶⁸Er', be: 8.10 }, { A: 197, name: '¹⁹⁷Au', be: 7.91 },
  { A: 238, name: '²³⁸U', be: 7.57 },
];

const FUSION_CHAINS = [
  { id: 'pp', label: 'pp chain', minT: '~4×10⁶ K', stars: 'Sun-like and lower-mass stars',
    eqs: [
      '¹H + ¹H → ²H + e⁺ + ν   (Q = 1.44 MeV, includes positron annihilation)',
      '²H + ¹H → ³He + γ          (Q = 5.49 MeV)',
      '³He + ³He → ⁴He + 2¹H     (Q = 12.86 MeV)',
    ],
    net: '4 ¹H → ⁴He + 2 e⁺ + 2 ν + 2 γ      (Q ≈ 26.73 MeV per ⁴He)',
    note: 'The slowest step is the very first: two protons converting one of themselves into a neutron via the weak interaction. That step is so rare it sets the Sun’s 10-billion-year MS lifetime. There are three pp-chain branches (pp-I, II, III) that differ in how ³He fuses.' },
  { id: 'cno', label: 'CNO cycle', minT: '~15×10⁶ K', stars: 'Stars more massive than ~1.3 M☉',
    eqs: [
      '¹²C + ¹H → ¹³N + γ',
      '¹³N → ¹³C + e⁺ + ν',
      '¹³C + ¹H → ¹⁴N + γ',
      '¹⁴N + ¹H → ¹⁵O + γ',
      '¹⁵O → ¹⁵N + e⁺ + ν',
      '¹⁵N + ¹H → ¹²C + ⁴He',
    ],
    net: '4 ¹H → ⁴He         (Q ≈ 26.73 MeV; ¹²C acts as a catalyst)',
    note: 'Carbon, nitrogen, and oxygen catalyse the conversion of four protons to one alpha particle. CNO is extremely temperature-sensitive (rate ∝ T¹⁷ near 15 MK). It dominates in stars above ~1.3 M☉ and powers the radiative cores of massive stars.' },
  { id: 'tri', label: 'Triple-alpha', minT: '~10⁸ K', stars: 'Helium-burning red giants',
    eqs: [
      '⁴He + ⁴He ⇌ ⁸Be   (⁸Be is unstable, lifetime ~10⁻¹⁶ s)',
      '⁸Be + ⁴He → ¹²C* → ¹²C + 2γ',
    ],
    net: '3 ⁴He → ¹²C       (Q ≈ 7.27 MeV)',
    note: 'Requires a fortunate resonance in ¹²C (predicted by Hoyle in 1953 before being measured). Without it, no carbon — and no carbon-based life. This is the “Hoyle state.” Rate scales like T⁴⁰ near 10⁸ K; tiny temperature changes drive enormous rate changes.' },
  { id: 'adv', label: 'Advanced burning', minT: '0.5–4 × 10⁹ K', stars: 'Massive stars only (>8 M☉)',
    eqs: [
      'Carbon burning:  ¹²C + ¹²C → various (²⁰Ne, ²³Na, ²³Mg, ²⁴Mg…)   T ≈ 6×10⁸ K',
      'Neon burning:    ²⁰Ne + γ → ¹⁶O + ⁴He;  ²⁰Ne + ⁴He → ²⁴Mg + γ      T ≈ 1.2×10⁹ K',
      'Oxygen burning:  ¹⁶O + ¹⁶O → ²⁸Si + ⁴He (and other channels)        T ≈ 2×10⁹ K',
      'Silicon burning: photodisintegration + α-capture → ⁵⁶Ni → ⁵⁶Fe       T ≈ 3.5×10⁹ K',
    ],
    net: 'End point: ⁵⁶Fe — no further fusion releases energy.',
    note: 'Each stage produces less energy and proceeds faster than the last. A 25 M☉ star burns hydrogen for ~7 Myr, helium for ~700 kyr, carbon for ~600 yr, neon for ~1 yr, oxygen for ~6 months, silicon for ~1 day. Then iron piles up — and the core collapses.' },
];

function NuclearFusion({ onBack }) {
  const [chain, setChain] = useState('pp');
  const current = FUSION_CHAINS.find(c => c.id === chain);

  // Binding energy curve
  const W = 900, H = 380;
  const PL = 70, PR = 870, PT = 30, PB = 320;
  const xA = a => PL + (PR - PL) * Math.log(a) / Math.log(260);
  const yBE = be => PB - (be / 10) * (PB - PT);

  return (
    <PageShell onBack={onBack} eyebrow="09 — Nuclear Astrophysics"
               title={<>Nuclear Fusion <em style={{ color: ACCENT, fontStyle: 'italic' }}>in stars</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Stars shine by binding lighter nuclei into heavier ones. The energy released comes from the
        difference in nuclear binding energy — a difference traced by a single curve, the most important
        plot in nuclear astrophysics.
      </p>

      {/* Binding energy curve */}
      <div className="mb-12">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
          The binding energy curve
        </div>
        <div className="relative" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
            {/* Fusion / fission regions */}
            <rect x={PL} y={PT} width={xA(56) - PL} height={PB - PT} fill={ACCENT} opacity="0.04" />
            <rect x={xA(56)} y={PT} width={PR - xA(56)} height={PB - PT} fill={ACCENT2} opacity="0.04" />
            <text x={(PL + xA(56)) / 2} y={PT + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                  fontSize="11" fill={ACCENT} letterSpacing="0.15em">FUSION RELEASES ENERGY →</text>
            <text x={(xA(56) + PR) / 2} y={PT + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                  fontSize="11" fill={ACCENT2} letterSpacing="0.15em">← FISSION RELEASES ENERGY</text>

            {/* Grid */}
            {[2, 4, 6, 8].map(y => (
              <g key={y}>
                <line x1={PL} x2={PR} y1={yBE(y)} y2={yBE(y)} stroke={BORDER} strokeWidth="0.5" />
                <text x={PL - 8} y={yBE(y) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>{y}</text>
              </g>
            ))}
            {[1, 4, 12, 56, 238].map(a => (
              <g key={a}>
                <line x1={xA(a)} x2={xA(a)} y1={PT} y2={PB} stroke={BORDER} strokeWidth="0.5" />
                <text x={xA(a)} y={PB + 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>{a}</text>
              </g>
            ))}

            {/* Curve */}
            <polyline fill="none" stroke={ACCENT} strokeWidth="1.5"
                      points={BE_DATA.map(d => `${xA(d.A)},${yBE(d.be)}`).join(' ')} />

            {/* Highlight Fe-56 */}
            <g>
              <line x1={xA(56)} x2={xA(56)} y1={PT} y2={PB} stroke={ACCENT} strokeDasharray="3 3" opacity="0.6" />
              <circle cx={xA(56)} cy={yBE(8.79)} r="5" fill={ACCENT} />
              <text x={xA(56) + 10} y={yBE(8.79) - 6} fontFamily="JetBrains Mono, monospace" fontSize="11" fill={ACCENT}>
                ⁵⁶Fe — 8.79 MeV/nucleon
              </text>
              <text x={xA(56) + 10} y={yBE(8.79) + 8} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>
                most tightly bound nucleus
              </text>
            </g>

            {/* Key data points */}
            {BE_DATA.filter(d => ['¹H','²H','⁴He','¹²C','¹⁶O','²³⁸U'].includes(d.name)).map(d => (
              <g key={d.name}>
                <circle cx={xA(d.A)} cy={yBE(d.be)} r="3" fill={INK} />
                <text x={xA(d.A)} y={yBE(d.be) - 8} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={INK}>
                  {d.name}
                </text>
              </g>
            ))}

            {/* Axes labels */}
            <text x={(PL + PR) / 2} y={H - 8} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                  fontSize="10" fill={INK} letterSpacing="0.15em">MASS NUMBER A (log scale)</text>
            <text x={PL - 50} y={(PT + PB) / 2} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}
                  transform={`rotate(-90, ${PL - 50}, ${(PT + PB) / 2})`} letterSpacing="0.15em">
              BINDING ENERGY (MeV/nucleon)
            </text>
          </svg>
        </div>
        <p className="font-display text-sm leading-relaxed mt-4 max-w-3xl" style={{ color: '#c8c3b1' }}>
          Binding energy per nucleon for stable isotopes. The peak at ⁵⁶Fe is why iron is the end of the
          fusion road. Fusing lighter elements together (left of the peak) releases energy. Splitting
          heavier ones (right of the peak) also releases energy — that’s fission. Iron does neither.
        </p>
      </div>

      {/* Fusion chains */}
      <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>
        The fusion processes
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-6" style={{ background: BORDER }}>
        {FUSION_CHAINS.map(c => (
          <button key={c.id} onClick={() => setChain(c.id)}
                  className="p-4 text-left transition"
                  style={{ background: chain === c.id ? `${ACCENT}15` : BG,
                           borderTop: chain === c.id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-lg mb-1" style={{ color: chain === c.id ? ACCENT : INK, letterSpacing: '-0.01em' }}>
              {c.label}
            </div>
            <div className="font-mono text-[10px]" style={{ color: DIM }}>{c.minT}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 fade-in" key={chain}>
        <div>
          <h3 className="font-display text-2xl mb-3" style={{ letterSpacing: '-0.01em' }}>
            {current.label}
          </h3>
          <p className="font-display text-base mb-6" style={{ color: '#c8c3b1' }}>
            Operates in: <em>{current.stars}</em>. Ignition temperature: <em>{current.minT}</em>.
          </p>

          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>Reactions</div>
          <div className="space-y-2 mb-6">
            {current.eqs.map((e, i) => (
              <div key={i} className="font-mono text-sm py-3 px-4 rounded"
                   style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
                {e}
              </div>
            ))}
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>Net result</div>
          <Eq>{current.net}</Eq>

          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <Section title="Where the Sun’s energy actually comes from">
              <p>
                Each pp-chain conversion of 4 hydrogen nuclei into one helium nucleus releases ~26.73 MeV,
                of which ~2% is carried away by neutrinos. The remaining ~26 MeV becomes thermal kinetic
                energy and, eventually, photons.
              </p>
              <p>
                For every kilogram of hydrogen the Sun fuses, ~7 grams are converted to pure energy via
                E = mc². The Sun fuses ~600 million tonnes of hydrogen per second, converting ~4.3 million
                tonnes of that into energy.
              </p>
              <Eq>L<sub>☉</sub> = ṁ c² ≈ (4.3 × 10⁹ kg/s) × (3 × 10⁸ m/s)² ≈ 3.8 × 10²⁶ W</Eq>
            </Section>

            <Section title="Why some stars use pp and others use CNO">
              <p>
                The CNO cycle is extraordinarily temperature-sensitive — its rate scales as roughly T¹⁷
                near 15 million K. Below that temperature pp wins easily; above it, CNO dominates. The
                crossover happens in stars of about 1.3 M☉.
              </p>
              <p>
                This sensitivity has structural consequences. Massive stars have radiative envelopes and
                convective cores (because CNO concentrates burning into a narrow temperature window). Low-mass
                stars are the opposite: convective envelopes, radiative cores.
              </p>
            </Section>

            <Section title="Where elements come from">
              <p>
                Big Bang nucleosynthesis (first ~20 minutes) made hydrogen, helium, and traces of lithium —
                nothing heavier. Everything else in the periodic table is synthesised somewhere by stars:
              </p>
              <p>
                <strong style={{ color: ACCENT }}>Stellar burning</strong> (hydrostatic): C, N, O, Ne, Mg, Si, S, Ar, Ca, Fe.<br />
                <strong style={{ color: ACCENT }}>Asymptotic giant branch / s-process</strong>: Sr, Y, Zr, Ba, Pb (slow neutron capture).<br />
                <strong style={{ color: ACCENT }}>Supernovae</strong>: more of the iron-peak elements and beyond.<br />
                <strong style={{ color: ACCENT }}>Neutron-star mergers / r-process</strong>: Au, Pt, U, the heaviest elements.<br />
                <strong style={{ color: ACCENT }}>Cosmic-ray spallation</strong>: Li, Be, B (skipped over by stars).
              </p>
              <p>
                Carl Sagan’s “we are made of star-stuff” is literally true: every carbon atom in your body
                was synthesised in the triple-alpha reaction inside some now-dead star.
              </p>
            </Section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start" style={{ borderLeft: `1px solid ${BORDER}` }}>
          <div className="pl-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>Why it matters</div>
            <p className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{current.note}</p>
          </div>
        </aside>
      </div>

      <Playground
        title="Mass-energy conversion in stars"
        description="Per fusion event, only ~0.7% of the rest mass is converted to energy. But over a star's lifetime that adds up to staggering totals. Play with luminosity to see annual mass-to-energy conversion."
        inputs={[
          { key: 'L', label: 'Luminosity', default: 1, min: -4, max: 6, log: true, unit: 'L☉' },
          { key: 't', label: 'Time elapsed', default: 1e9, min: 0, max: 10.7, log: true, unit: 'yr' },
        ]}
        compute={(v) => {
          const L_watts = v.L * 3.828e26;
          const c2 = Math.pow(2.998e8, 2);
          const dm_per_s = L_watts / c2;
          const dm_per_yr = dm_per_s * 3.156e7;
          const dm_total = dm_per_yr * v.t;
          const Msun_kg = 1.989e30;
          const dm_total_Msun = dm_total / Msun_kg;
          const dm_per_yr_tonnes = dm_per_yr / 1000;
          return { dm_per_s, dm_per_yr_tonnes, dm_total, dm_total_Msun };
        }}
        outputs={[
          { key: 'dm_per_s', label: 'Mass-to-energy per second', unit: 'kg/s' },
          { key: 'dm_per_yr_tonnes', label: 'Mass-to-energy per year', unit: 'tonnes/yr' },
          { key: 'dm_total', label: 'Total mass converted over period', unit: 'kg' },
          { key: 'dm_total_Msun', label: 'In solar masses', unit: 'M☉' },
        ]}
      />

      <WorkedExample title="Why does the iron peak end fusion?"
                     steps={[
                       { text: 'The binding energy per nucleon peaks at ⁵⁶Fe (~8.79 MeV/nucleon). Fusing two lighter nuclei into a heavier one releases energy if and only if the product sits higher on the binding-energy curve than the reactants.',
                         eq: 'Q = (BE_product − Σ BE_reactants) × A_product' },
                       { text: 'For ¹²C + ¹²C → ²⁴Mg: BE(¹²C) = 7.68 MeV/nucleon, BE(²⁴Mg) = 8.26 MeV/nucleon. Energy released per Mg nucleus formed:',
                         eq: 'Q = 24 × 8.26 − 2 × (12 × 7.68) = 198.2 − 184.3 ≈ +14 MeV (released)' },
                       { text: 'But for ⁵⁶Fe + ⁴He → ⁶⁰Ni: BE(⁶⁰Ni) = 8.78 MeV/nucleon, similar to ⁵⁶Fe. The total binding energy of the product is barely more than the reactants.',
                         eq: 'Q = 60 × 8.78 − 56 × 8.79 − 4 × 7.07 ≈ −2 MeV (absorbed)',
                         answer: 'Fusion past iron consumes energy rather than releasing it. The core has no choice but to collapse once it builds up too much iron. This is the cliff that ends a massive star\'s life.' },
                     ]} />

      <Quiz questions={[
        { q: 'In the pp-chain, the slowest step (the rate-limiter for the whole Sun) is:',
          options: ['p + p → ²H + e⁺ + ν', '²H + p → ³He + γ', '³He + ³He → ⁴He + 2p', 'CNO catalysis'],
          correct: 0,
          explain: 'The first step — proton fusing to proton via the weak force — is exquisitely slow. A proton in the Sun\'s core waits ~10⁹ years on average before fusing with another. This is what makes stars long-lived: the weak interaction is feeble enough to throttle fusion to a glacial rate.' },
        { q: 'Why is CNO dominant in massive stars but minor in the Sun?',
          options: ['Only massive stars contain C, N, O', 'CNO rate ∝ T¹⁷ — sensitive enough that small temperature differences matter enormously', 'pp is unstable above 1.3 M☉', 'It has nothing to do with mass'],
          correct: 1,
          explain: 'The CNO cycle requires hotter cores to overcome the higher Coulomb barriers (C, N, O have Z=6,7,8 vs H\'s Z=1). The rate scales as T¹⁷ near 15 MK. The Sun\'s core (~15.7 MK) sits right at the crossover; a 2 M☉ star\'s core at ~20 MK is dominated by CNO; a 0.5 M☉ star\'s core at ~9 MK runs essentially pure pp.' },
        { q: 'How much hydrogen does the Sun fuse per second?',
          options: ['~600 tonnes', '~600,000 tonnes', '~600 million tonnes', '~600 billion tonnes'],
          correct: 2,
          explain: '~600 million tonnes per second. Of this, ~0.7% (≈4.3 million tonnes) is converted to pure energy. At this rate the Sun will exhaust its core hydrogen in ~5 Gyr. The total mass loss over the Sun\'s entire MS lifetime is ~10⁻⁴ M☉ — the Sun barely notices.' },
      ]} />

      <OpenQuestions items={[
        { q: 'Where exactly do the heaviest elements come from?',
          detail: '— Elements heavier than iron form by neutron capture (s-process in AGB stars, r-process in extreme environments). The 2017 detection of GW170817 confirmed neutron-star mergers produce r-process elements (gold, platinum, uranium). But how much vs core-collapse SNe vs other channels? An active research area.' },
        { q: 'What is the precise Hoyle state of ¹²C, and what does it tell us about fundamental physics?',
          detail: '— The triple-alpha process depends on a specific excited state in ¹²C at 7.65 MeV. Without this state, virtually no carbon would exist — and no us. Lattice QCD calculations now reproduce this state from first principles, but the apparent "fine-tuning" of nuclear parameters that allows it remains a puzzle.' },
        { q: 'Why do solar neutrino measurements not perfectly match models?',
          detail: '— The 2002 confirmation of neutrino oscillation resolved the "solar neutrino problem". But finer measurements now hint at small remaining discrepancies in neutrino flux ratios from different solar fusion branches, possibly indicating sub-percent issues with solar opacity or composition models.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  05 · SPECTRAL CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════════════
const SPEC_CLASSES = [
  { letter: 'O', tempRange: '> 30,000 K', massRange: '> 16 M☉', color: '#9bb0ff',
    lines: [ { x: 0.18, depth: 0.5, label: 'He II' }, { x: 0.32, depth: 0.4, label: 'He I' }, { x: 0.55, depth: 0.25, label: 'Hβ' } ],
    examples: 'ζ Puppis, λ Cep, Mintaka (O9.5)',
    desc: 'Hot blue stars dominated by ionised helium absorption (He II). Hydrogen lines are weak because at these temperatures most H is fully ionised. Extremely short-lived — only a few million years on the main sequence — and rare. Their UV output drives the ionisation of HII regions around them.' },
  { letter: 'B', tempRange: '10,000 – 30,000 K', massRange: '2.1 – 16 M☉', color: '#aabfff',
    lines: [ { x: 0.35, depth: 0.6, label: 'He I' }, { x: 0.55, depth: 0.5, label: 'Hβ' }, { x: 0.72, depth: 0.55, label: 'Hα' } ],
    examples: 'Rigel, Spica, Regulus',
    desc: 'Hot blue-white stars. Neutral helium lines peak around B2. Hydrogen Balmer lines strengthen toward later B types as the surface cools and more electrons sit in the n=2 state needed to absorb Balmer photons.' },
  { letter: 'A', tempRange: '7,500 – 10,000 K', massRange: '1.4 – 2.1 M☉', color: '#cad7ff',
    lines: [ { x: 0.32, depth: 0.7, label: 'Hδ' }, { x: 0.45, depth: 0.85, label: 'Hγ' }, { x: 0.6, depth: 0.9, label: 'Hβ' }, { x: 0.78, depth: 0.85, label: 'Hα' } ],
    examples: 'Vega, Sirius A, Altair',
    desc: 'Strong hydrogen Balmer absorption — the strongest of any spectral class. The temperature is just right: enough electrons in the n=2 state to absorb, but not so hot that H is largely ionised. Vega is the prototype for the photometric magnitude system.' },
  { letter: 'F', tempRange: '6,000 – 7,500 K', massRange: '1.04 – 1.4 M☉', color: '#f8f7ff',
    lines: [ { x: 0.28, depth: 0.65, label: 'Ca II K' }, { x: 0.3, depth: 0.5, label: 'Ca II H' }, { x: 0.45, depth: 0.55, label: 'Hγ' }, { x: 0.6, depth: 0.6, label: 'Hβ' }, { x: 0.7, depth: 0.4, label: 'metals' } ],
    examples: 'Procyon, Polaris, Canopus',
    desc: 'Hydrogen lines weakening; metal lines (Fe, Ca, Mg) strengthening. Ca II H and K lines (singly-ionised calcium) become prominent. F-type stars include many Cepheid variable supergiants used as distance indicators.' },
  { letter: 'G', tempRange: '5,200 – 6,000 K', massRange: '0.8 – 1.04 M☉', color: '#fff4ea',
    lines: [ { x: 0.28, depth: 0.85, label: 'Ca II K' }, { x: 0.3, depth: 0.7, label: 'Ca II H' }, { x: 0.6, depth: 0.45, label: 'Hβ' }, { x: 0.7, depth: 0.65, label: 'Fe, Mg' }, { x: 0.85, depth: 0.55, label: 'G band' } ],
    examples: 'Sun, Alpha Centauri A, Capella',
    desc: 'Sun-like yellow stars. Ca II H and K dominate the blue. The "G band" (CH molecular absorption near 430 nm) becomes visible — the first hint of molecules surviving in the photosphere. Hydrogen lines now weak but still present.' },
  { letter: 'K', tempRange: '3,700 – 5,200 K', massRange: '0.45 – 0.8 M☉', color: '#ffd2a1',
    lines: [ { x: 0.28, depth: 0.9, label: 'Ca II' }, { x: 0.5, depth: 0.7, label: 'Fe, Ti' }, { x: 0.7, depth: 0.7, label: 'metals' }, { x: 0.88, depth: 0.4, label: 'TiO (weak)' } ],
    examples: 'Arcturus, Aldebaran, Alpha Centauri B',
    desc: 'Orange stars. Metal lines dominate. The first molecular bands appear in the red end of the spectrum — TiO (titanium oxide) starts to be visible in cooler K stars. The Sun’s spectrum, redshifted in temperature, would look like this in a few billion years.' },
  { letter: 'M', tempRange: '< 3,700 K', massRange: '0.08 – 0.45 M☉', color: '#ffa070',
    lines: [ { x: 0.35, depth: 0.4, label: 'metals' }, { x: 0.55, depth: 0.85, label: 'TiO' }, { x: 0.7, depth: 0.95, label: 'TiO' }, { x: 0.85, depth: 0.9, label: 'TiO, VO' } ],
    examples: 'Proxima Centauri, Barnard’s Star, Betelgeuse (cool supergiant)',
    desc: 'Cool red stars. Photosphere is cool enough that molecules survive — TiO bands carve massive absorption troughs across the spectrum. ~75% of all stars are M dwarfs. The galaxy is overwhelmingly red dwarfs; we just don’t see them because they are dim.' },
];

function SpectralClass({ onBack }) {
  const [sel, setSel] = useState('G');
  const c = SPEC_CLASSES.find(c => c.letter === sel);

  const W = 900, H = 200;
  // Spectrum gradient by temperature - the wavelength range goes 400-700 nm
  const tempColor = c.color;

  return (
    <PageShell onBack={onBack} eyebrow="06 — Observational Stellar Spectroscopy"
               title={<><em style={{ color: ACCENT, fontStyle: 'italic' }}>Spectral</em> Classification</>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        A star’s spectrum is a bar code. Absorption lines are produced by atoms and ions in the cooler
        outer layers eating photons from the hot continuum below. Which lines show up — and how strong they are —
        depends almost entirely on surface temperature, which is why a single letter (OBAFGKM) plus a digit captures
        most of stellar physics.
      </p>

      {/* Spectrum picker */}
      <div className="grid grid-cols-7 gap-px mb-6" style={{ background: BORDER }}>
        {SPEC_CLASSES.map(sc => (
          <button key={sc.letter} onClick={() => setSel(sc.letter)}
                  className="p-4 text-center transition"
                  style={{ background: sel === sc.letter ? `${sc.color}15` : BG,
                           borderTop: sel === sc.letter ? `2px solid ${sc.color}` : `2px solid transparent` }}>
            <div className="font-display text-3xl mb-1" style={{ color: sc.color, letterSpacing: '-0.01em' }}>{sc.letter}</div>
            <div className="font-mono text-[10px]" style={{ color: DIM }}>{sc.tempRange.split('–')[0].replace('> ','>').replace('< ','<').replace(/,/g,'').replace(' K','K')}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 fade-in" key={sel}>
        <div>
          {/* Spectrum */}
          <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
            Schematic spectrum · class {c.letter}
          </div>
          <div className="relative" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              <defs>
                <linearGradient id="spec-gradient" x1="0" x2="1">
                  <stop offset="0%" stopColor="#5a3399" />
                  <stop offset="15%" stopColor="#3361cc" />
                  <stop offset="35%" stopColor="#2eb8b8" />
                  <stop offset="55%" stopColor="#7cc44a" />
                  <stop offset="70%" stopColor="#e6c84d" />
                  <stop offset="85%" stopColor="#e67c4d" />
                  <stop offset="100%" stopColor="#b03030" />
                </linearGradient>
              </defs>
              {/* Continuum spectrum */}
              <rect x="40" y="40" width={W - 80} height={H - 80} fill="url(#spec-gradient)" opacity="0.85" />
              {/* Absorption lines */}
              {c.lines.map((line, i) => {
                const x = 40 + (W - 80) * line.x;
                const w = 6 + line.depth * 14;
                return (
                  <g key={i}>
                    <rect x={x - w/2} y="40" width={w} height={H - 80} fill="#000" opacity={line.depth} />
                    <line x1={x} x2={x} y1={H - 40} y2={H - 30} stroke={INK} />
                    <text x={x} y={H - 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                          fontSize="10" fill={INK}>{line.label}</text>
                  </g>
                );
              })}
              {/* Wavelength labels */}
              <text x="40" y="30" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>400 nm</text>
              <text x={W - 40} y="30" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>700 nm</text>
              <text x={W / 2} y="30" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>visible spectrum</text>
            </svg>
          </div>

          {/* Class info */}
          <div className="mt-6 grid grid-cols-3 gap-px" style={{ background: BORDER }}>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Temperature</div>
              <div className="font-display text-base" style={{ color: INK }}>{c.tempRange}</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>MS mass range</div>
              <div className="font-display text-base" style={{ color: INK }}>{c.massRange}</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Examples</div>
              <div className="font-display text-base" style={{ color: INK }}>{c.examples}</div>
            </div>
          </div>

          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <Section title="Why the OBAFGKM sequence is in this order">
              <p>
                It’s a temperature sequence — and reading from O to M is reading from hot to cool. The
                ordering was empirical for decades before anyone understood why. Annie Jump Cannon arranged
                the classes by hydrogen-line strength at Harvard around 1900; Cecilia Payne-Gaposchkin
                explained the underlying physics in her 1925 PhD thesis: stars are mostly hydrogen, and the
                visible spectrum is set primarily by temperature, not composition.
              </p>
              <p>
                Payne-Gaposchkin’s thesis was called by Otto Struve “the most brilliant PhD thesis ever
                written in astronomy.” Worth knowing about.
              </p>
            </Section>

            <Section title="The Saha equation — why hydrogen is strongest in A stars">
              <Eq>n<sub>i+1</sub> n<sub>e</sub> / n<sub>i</sub> ∝ T<sup>3/2</sup> e<sup>−χ/kT</sup></Eq>
              <p>
                The Saha equation governs ionisation balance. For hydrogen, the Balmer absorption lines
                require electrons in the n=2 state. In cool stars there aren’t enough thermally excited
                atoms; in hot stars the hydrogen is fully ionised so there’s nothing to absorb. The peak
                occurs around 9,000–10,000 K — squarely in spectral class A. That’s why Vega and Sirius
                have those razor-sharp Balmer lines.
              </p>
            </Section>

            <Section title="The MK luminosity classes">
              <p>
                Spectral type alone fixes a star’s position on the H–R diagram along the temperature axis.
                The luminosity class fixes it along the luminosity axis:
              </p>
              <p>
                <strong style={{ color: ACCENT }}>Ia, Iab, Ib</strong> — supergiants (Ia is brightest)<br />
                <strong style={{ color: ACCENT }}>II</strong> — bright giants<br />
                <strong style={{ color: ACCENT }}>III</strong> — giants<br />
                <strong style={{ color: ACCENT }}>IV</strong> — subgiants<br />
                <strong style={{ color: ACCENT }}>V</strong> — main-sequence (“dwarfs”)<br />
                <strong style={{ color: ACCENT }}>VI</strong> — subdwarfs (metal-poor)<br />
                <strong style={{ color: ACCENT }}>VII / D</strong> — white dwarfs
              </p>
              <p>
                The Sun is G2V; Betelgeuse is M1-2Ia; Sirius B is DA2. Together with a temperature
                subclass and a luminosity class, this notation pins down most of a star’s physical
                properties from spectroscopy alone — without ever measuring its distance.
              </p>
            </Section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start" style={{ borderLeft: `1px solid ${BORDER}` }}>
          <div className="pl-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>Class {c.letter}</div>
            <p className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{c.desc}</p>
          </div>
        </aside>
      </div>

      <Playground
        title="From temperature to spectral class and colour"
        description="Wien's displacement law gives the peak emission wavelength from temperature. The spectral class boundary you cross is what observers see in the spectrum: which absorption lines dominate."
        inputs={[
          { key: 'T', label: 'Surface temperature', default: 5778, min: 2500, max: 50000, step: 100, unit: 'K' },
        ]}
        compute={(v) => {
          const b = 2.898e-3;
          const lambda_peak_m = b / v.T;
          const lambda_peak_nm = lambda_peak_m * 1e9;
          const spectralClass = spectralLetter(v.T);
          let colour;
          if (v.T >= 30000) colour = 'Blue';
          else if (v.T >= 10000) colour = 'Blue-white';
          else if (v.T >= 7500) colour = 'White';
          else if (v.T >= 6000) colour = 'Yellow-white';
          else if (v.T >= 5200) colour = 'Yellow';
          else if (v.T >= 3700) colour = 'Orange';
          else colour = 'Red';
          let regime;
          if (lambda_peak_nm < 380) regime = 'UV';
          else if (lambda_peak_nm < 750) regime = 'Visible';
          else regime = 'Infrared';
          return { spectralClass, colour, lambda_peak_nm, regime };
        }}
        outputs={[
          { key: 'spectralClass', label: 'Spectral class (MK)', unit: '' },
          { key: 'colour', label: 'Apparent colour', unit: '' },
          { key: 'lambda_peak_nm', label: 'Peak wavelength (Wien)', unit: 'nm' },
          { key: 'regime', label: 'Spectral regime of peak', unit: '' },
        ]}
      />

      <WorkedExample title="Why does Vega look white but Betelgeuse looks red?"
                     steps={[
                       { text: 'Vega is an A-type star with T ≈ 9,600 K. Apply Wien\'s law to find where the Planck blackbody curve peaks:',
                         eq: 'λ_peak = b/T = (2.898 × 10⁻³ m·K) / 9600 K ≈ 302 nm' },
                       { text: 'That\'s in the near-UV — past the violet edge of human vision. The visible part of Vega\'s spectrum gets light fairly evenly across all wavelengths, with slightly more blue than red. Result: it looks white-ish blue-white.',
                         eq: 'For Betelgeuse: λ_peak = 2.898e−3 / 3500 ≈ 828 nm' },
                       { text: 'Betelgeuse peaks in the near-infrared. Of the visible band, its light is heavily weighted toward red. There\'s also a substantial fraction of its emission past 700 nm that we never see.',
                         answer: 'Vega: peak in UV, visible spectrum heavily blue → white-blue. Betelgeuse: peak in IR, visible spectrum heavily red → distinctly orange-red. Same star colours, very different physical reasons.' },
                     ]} />

      <Quiz questions={[
        { q: 'A star with hydrogen Balmer absorption stronger than any other class is most likely:',
          options: ['O', 'B', 'A', 'M'],
          correct: 2,
          explain: 'A-type stars (around 9,000–10,000 K) have the strongest Balmer absorption lines of any spectral class. At lower T, fewer electrons sit in the n=2 state needed to absorb Balmer photons. At higher T, hydrogen is mostly ionised, leaving no neutral atoms to absorb. The Goldilocks zone is class A.' },
        { q: 'The mnemonic for spectral classes "Oh Be A Fine Girl/Guy, Kiss Me" runs in order of:',
          options: ['Increasing mass', 'Increasing temperature', 'Decreasing temperature', 'Decreasing luminosity'],
          correct: 2,
          explain: 'O is hottest (>30,000 K) and M is coolest (<3,700 K). The sequence runs hot → cool. Mass and luminosity also generally decrease O → M for main-sequence stars, but the primary defining axis is temperature.' },
        { q: 'TiO molecular absorption bands are a hallmark of which spectral class?',
          options: ['O', 'A', 'G', 'M'],
          correct: 3,
          explain: 'Titanium oxide molecules can only exist at temperatures cool enough not to dissociate. Below ~3,700 K (the M-class regime), TiO carves giant absorption troughs across the spectrum, giving M-dwarfs and red giants their distinctive jagged spectra and reddish appearance.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  06 · COSMIC DISTANCE LADDER
// ═══════════════════════════════════════════════════════════════════════════
const LADDER = [
  { id: 'radar', name: 'Radar & laser ranging', range: '< 50 AU', accuracy: 'metres',
    desc: 'Bounce a radar pulse off Venus or a laser off the lunar retroreflectors. Time of flight × c = distance. This is how the astronomical unit (AU) is now defined directly — to ~mm accuracy for the Moon.',
    note: 'Anchors the entire ladder. Every higher rung is calibrated by reference, eventually, back to this one.' },
  { id: 'paral', name: 'Trigonometric parallax', range: '< 10 kpc', accuracy: 'μas–mas',
    desc: 'Earth’s orbit gives a 2-AU baseline. Nearby stars appear to shift against the background as we move. The parallax angle p is half the apparent annual shift.',
    eq: 'd (pc) = 1 / p (arcsec)',
    note: 'Defines the parsec: the distance at which 1 AU subtends 1 arcsecond. Gaia (2014–) measures parallaxes to μas precision, reaching distances of ~10 kpc for bright stars — across most of the Milky Way.' },
  { id: 'spec',  name: 'Spectroscopic parallax', range: '< 1 Mpc', accuracy: '20%',
    desc: 'Classify a star’s spectrum (which fixes its luminosity from the H–R diagram), measure its apparent brightness, and use the inverse-square law to get distance. No actual parallax involved — the name is a historical misnomer.',
    eq: 'm − M = 5 log₁₀(d/pc) − 5',
    note: 'm is apparent magnitude, M is absolute magnitude. Works for any star whose spectrum you can take. Less precise than parallax but reaches much further.' },
  { id: 'cep',   name: 'Cepheid period–luminosity', range: '< 50 Mpc', accuracy: '5%',
    desc: 'Cepheid variable stars pulsate with periods that correlate tightly with their intrinsic luminosity. Discovered by Henrietta Swan Leavitt in 1908 from photographic plates of the Small Magellanic Cloud.',
    eq: 'M_V ≈ −2.78 log₁₀(P / days) − 1.35',
    note: 'Hubble used Cepheids in the Andromeda “nebula” to prove in 1924 that it lay far outside the Milky Way, settling the Great Debate and establishing the existence of other galaxies.' },
  { id: 'sn',    name: 'Type Ia supernovae', range: '< 10⁴ Mpc',  accuracy: '5–10%',
    desc: 'A white dwarf accreting mass from a companion exceeds the Chandrasekhar limit and detonates as a thermonuclear runaway. The peak luminosity is remarkably uniform because the explosion mechanism is set by fundamental physics. After light-curve standardisation, Type Ia SNe are excellent standard candles.',
    eq: 'M_V ≈ −19.3 (at peak, after light-curve correction)',
    note: 'Used in 1998 by two independent teams (Perlmutter; Riess & Schmidt) to discover the accelerating expansion of the universe → 2011 Nobel Prize. Reaches z ~ 2.' },
  { id: 'hub',   name: 'Hubble flow / redshift', range: 'z > 0.01 → cosmic scales', accuracy: '~1% in H₀',
    desc: 'Beyond local-galaxy motions, the cosmological redshift of spectral lines gives recession velocity. Distance follows from Hubble’s law, calibrated by the lower rungs.',
    eq: 'v = H₀ d   (with H₀ ≈ 67–73 km/s/Mpc)',
    note: 'The current ~5σ tension between local H₀ measurements (~73 km/s/Mpc, from SNe + Cepheids) and CMB-inferred H₀ (~67 km/s/Mpc, from Planck) is one of the most important open problems in cosmology.' },
];

function DistanceLadder({ onBack }) {
  const [open, setOpen] = useState('paral');

  return (
    <PageShell onBack={onBack} eyebrow="12 — Cosmography"
               title={<>The Cosmic <em style={{ color: ACCENT, fontStyle: 'italic' }}>Distance Ladder</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Astronomy faces a deep problem: we cannot move. Every distance — from the Moon to the most distant
        galaxies — must be inferred from things we can measure here, now, with light. The ladder is a
        chain of overlapping methods, each calibrated by the rung below.
      </p>

      <div className="space-y-px mb-10" style={{ background: BORDER }}>
        {LADDER.map((rung, i) => {
          const isOpen = open === rung.id;
          return (
            <div key={rung.id} style={{ background: BG }}>
              <button onClick={() => setOpen(isOpen ? null : rung.id)}
                      className="w-full text-left p-6 transition hover:bg-white/[0.02]">
                <div className="flex items-start gap-6">
                  <div className="font-mono text-2xl" style={{ color: DIM, minWidth: 40 }}>0{i+1}</div>
                  <div className="flex-1">
                    <div className="font-display text-2xl mb-1" style={{ letterSpacing: '-0.01em', color: isOpen ? ACCENT : INK }}>
                      {rung.name}
                    </div>
                    <div className="flex flex-wrap gap-4 font-mono text-xs" style={{ color: DIM }}>
                      <span>range: {rung.range}</span>
                      <span>·</span>
                      <span>accuracy: {rung.accuracy}</span>
                    </div>
                  </div>
                  <div className="font-mono text-xs" style={{ color: DIM }}>
                    {isOpen ? '−' : '+'}
                  </div>
                </div>
              </button>
              {isOpen && (
                <div className="px-6 pb-6 pl-[88px] fade-in">
                  <p className="font-display text-base leading-relaxed mb-3 max-w-3xl" style={{ color: '#c8c3b1' }}>{rung.desc}</p>
                  {rung.eq && <Eq>{rung.eq}</Eq>}
                  <p className="font-display text-sm leading-relaxed italic mt-3 max-w-3xl" style={{ color: DIM }}>{rung.note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
        <Section title="Why a “ladder”?">
          <p>
            Each method only works in a limited distance range. Parallax fails beyond ~10 kpc because angles
            become unmeasurably small. Cepheids run out beyond ~50 Mpc because individual stars become too
            faint. Type Ia supernovae are rare. So we use each method to calibrate the next: parallax
            measures distances to nearby Cepheids (anchoring the P-L relation); Cepheids in nearby galaxies
            anchor Type Ia supernovae found in the same galaxies; Type Ia SNe at moderate redshift anchor
            the Hubble flow at high redshift.
          </p>
          <p>
            Every rung is one calibration step away from a higher-precision method. Errors propagate. The
            biggest residual systematic in the ladder is at the Cepheid–SN Ia step — and this is the
            heart of the “Hubble tension.”
          </p>
        </Section>

        <Section title="The Hubble tension in one paragraph">
          <p>
            If you build the ladder from local data — parallax → Cepheids → Type Ia SNe — you get H₀ ≈
            73 km/s/Mpc (the “late universe” value, SH0ES collaboration). If you derive H₀ from the angular
            scale of the cosmic microwave background under standard cosmology — “early universe” — you get
            H₀ ≈ 67 km/s/Mpc (Planck). The disagreement is now ~5σ and stubbornly resists every explanation
            tried so far. Either there’s a subtle systematic in one of the measurements, or our cosmological
            model is missing something.
          </p>
        </Section>

        <Section title="A worked example: distance to Andromeda">
          <p>
            Hubble (1924): identified Cepheids in M31. Period ≈ 31 days. Period–luminosity relation gives
            absolute magnitude M ≈ −5. Apparent magnitude m ≈ 19. Distance modulus m − M ≈ 24, so distance
            ≈ 10⁽²⁴⁺⁵⁾/⁵ pc = 10⁵·⁸ pc ≈ 640 kpc. Andromeda lay far outside the Milky Way.
          </p>
          <p>
            Modern value (Gaia + revised Cepheid calibration): 765 ± 25 kpc, or ~2.5 million light-years.
            Hubble was within 20%. Considering he was the first to do it, that’s remarkable.
          </p>
        </Section>

        <Playground
          title="Distance from parallax"
          description="The parallax angle p (in arcseconds) gives distance in parsecs as d = 1/p. Try plugging in real measurements."
          inputs={[
            { key: 'p', label: 'Parallax angle', default: 0.1, min: -3, max: 1, log: true, unit: 'arcsec' },
          ]}
          compute={(v) => {
            const d_pc = 1 / v.p;
            const d_ly = d_pc * 3.262;
            const d_km = d_pc * 3.086e13;
            return { d_pc, d_ly, d_km };
          }}
          outputs={[
            { key: 'd_pc', label: 'Distance', unit: 'pc' },
            { key: 'd_ly', label: 'Distance', unit: 'ly' },
            { key: 'd_km', label: 'Distance', unit: 'km' },
          ]}
        />

        <Playground
          title="Distance from a Cepheid"
          description="Use the period-luminosity relation. The Leavitt law gives M_V from the pulsation period; with the apparent magnitude m, the distance modulus gives the distance."
          inputs={[
            { key: 'P', label: 'Pulsation period', default: 10, min: 0, max: 2, log: true, unit: 'days' },
            { key: 'm', label: 'Apparent magnitude m', default: 12, min: 4, max: 25, step: 0.1, unit: 'mag' },
          ]}
          compute={(v) => {
            // Leavitt law (V band): M_V ≈ -2.78 log P - 1.35
            const Mv = -2.78 * Math.log10(v.P) - 1.35;
            const distMod = v.m - Mv;
            const d_pc = Math.pow(10, distMod / 5 + 1);
            const d_kpc = d_pc / 1000;
            const d_Mpc = d_pc / 1e6;
            return { Mv, distMod, d_pc, d_kpc, d_Mpc };
          }}
          outputs={[
            { key: 'Mv', label: 'Absolute magnitude M_V', unit: 'mag' },
            { key: 'distMod', label: 'Distance modulus (m − M)', unit: 'mag' },
            { key: 'd_pc', label: 'Distance', unit: 'pc' },
            { key: 'd_kpc', label: 'Distance', unit: 'kpc' },
            { key: 'd_Mpc', label: 'Distance', unit: 'Mpc' },
          ]}
        />

        <WorkedExample title="Cosmological distance from redshift"
                       steps={[
                         { text: 'A galaxy\'s spectrum shows the H-alpha line, normally at 656.3 nm, observed at 730 nm. Compute the redshift.',
                           eq: 'z = (λ_obs − λ_rest) / λ_rest = (730 − 656.3) / 656.3' },
                         { text: 'This gives z = 0.112, a low redshift where the simple Hubble law applies.',
                           eq: 'v = cz = (3 × 10⁵ km/s) × 0.112 ≈ 33,700 km/s' },
                         { text: 'Apply Hubble\'s law with H₀ ≈ 70 km/s/Mpc:',
                           eq: 'd = v / H₀ = 33,700 / 70',
                           answer: '≈ 480 Mpc ≈ 1.6 billion light-years. We see this galaxy as it was 1.6 Gyr ago. At higher z (z > 0.3), the simple v = cz approximation breaks down and full GR is needed to convert redshift to distance.' },
                       ]} />

        <Quiz questions={[
          { q: 'A star has parallax 0.5 arcseconds. How far away is it?',
            options: ['0.5 parsec', '1 parsec', '2 parsec', '5 parsec'],
            correct: 2,
            explain: 'd (pc) = 1 / p (arcsec). 1 / 0.5 = 2 pc. The parsec is defined as the distance giving exactly 1 arcsec of parallax. Larger parallax angle = closer star.' },
          { q: 'Why does the Cosmic Distance Ladder need so many "rungs"?',
            options: ['To be more accurate', 'No single method works at all distances', 'Different colours of light see different distances', 'Tradition'],
            correct: 1,
            explain: 'Each method only works in a limited range. Parallax fails beyond ~10 kpc (angles too small); Cepheids fade beyond ~50 Mpc; supernovae are rare. Each rung is calibrated by the one below.' },
          { q: 'The Hubble tension is the disagreement between H₀ measured from:',
            options: ['Earth vs space-based telescopes', 'Cepheids vs supernovae', 'Local distance ladder (~73 km/s/Mpc) vs CMB (~67 km/s/Mpc)', 'Optical vs radio observations'],
            correct: 2,
            explain: 'Local measurements using parallax → Cepheids → Type Ia SNe give H₀ ≈ 73; the CMB combined with ΛCDM gives H₀ ≈ 67. The disagreement is ~5σ and resists every explanation tried. Either there\'s an unidentified systematic, or our cosmological model is incomplete.' },
        ]} />

        <TryThis title="Measure a real cosmic distance yourself"
                 items={[
                   { title: 'Estimate the Moon\'s distance by parallax', text: 'Have a friend ~1 km away photograph the Moon at exactly the same time as you, both with a distant landmark in frame. The Moon\'s position relative to the landmark will shift between the two photos. Use the geometry (baseline of 1 km, measured angle shift) to compute the Moon\'s distance — you should get something near 400,000 km.', gear: 'Two phone cameras, one friend, a clear night' },
                   { title: 'Find a Cepheid in real data', text: 'Download AAVSO data for any well-known Cepheid (δ Cephei itself is good). Plot magnitude vs time. The light curve repeats with the same period the discovery used to set the P-L relation.', gear: 'Browser + free AAVSO account' },
                 ]} />

        <OpenQuestions items={[
          { q: 'Is the Hubble tension real?',
            detail: '— After a decade of effort, the discrepancy between local (~73) and CMB (~67) H₀ measurements has not narrowed. Either there\'s a subtle systematic in the Cepheid/SN Ia calibration chain or in the CMB analysis, or there\'s new physics: early dark energy, modified neutrino interactions, or a deviation from ΛCDM at recombination.' },
          { q: 'What if Type Ia supernovae are not as standard as we think?',
            detail: '— Modern surveys are finding evidence that Type Ia SNe in different host galaxy types may have slightly different intrinsic luminosities. A ~1-2% effect at this level would shift H₀ enough to matter.' },
          { q: 'Can gravitational-wave "standard sirens" break the tension?',
            detail: '— Binary neutron star mergers provide an independent distance measurement (via the GW waveform amplitude) that doesn\'t depend on the distance ladder. GW170817 gave one such measurement; more are coming. With ~50 events we should have a clean independent H₀.' },
        ]} />
      </div>
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  07 · BLACK HOLE ANATOMY
// ═══════════════════════════════════════════════════════════════════════════
function BlackHole({ onBack }) {
  const [logM, setLogM] = useState(1); // log10(M / M☉), so 1 = 10 M☉
  const [spin, setSpin] = useState(0); // 0 = Schwarzschild, 0.998 = max Kerr
  const M = Math.pow(10, logM); // M / M☉

  // Constants
  const G = 6.674e-11;
  const c = 2.998e8;
  const Msun = 1.989e30;
  const hbar = 1.055e-34;
  const kB = 1.381e-23;

  // Schwarzschild radius (km)
  const rs_km = 2 * G * (M * Msun) / (c * c) / 1000;
  // Photon sphere for Schwarzschild: 1.5 r_s
  const photonRadius = 1.5;
  // ISCO for Schwarzschild: 3 r_s, drops to 0.5 r_s for max prograde spin
  const isco_rs = 3 - 2.5 * spin; // very rough interp
  // Hawking temperature (Schwarzschild)
  const T_H = (hbar * Math.pow(c, 3)) / (8 * Math.PI * G * (M * Msun) * kB);
  // Evaporation time (Schwarzschild, in years, very approximate)
  const t_evap = 2.1e67 * Math.pow(M, 3); // years for M solar masses

  // Visualization
  const W = 900, H = 520;
  const cx = W / 2, cy = H / 2;
  const rUnit = 70; // pixels per r_s

  const markers = [
    { m: 3, label: '3 M☉', sub: 'stellar BH min' },
    { m: 10, label: '10 M☉', sub: 'typical X-ray binary' },
    { m: 100, label: '100 M☉', sub: 'intermediate' },
    { m: 4.3e6, label: '4.3M M☉', sub: 'Sgr A* (MW centre)' },
    { m: 6.5e9, label: '6.5G M☉', sub: 'M87* (EHT image)' },
  ];

  return (
    <PageShell onBack={onBack} eyebrow="16 — Compact Objects & Relativity"
               title={<>Anatomy of a <em style={{ color: ACCENT, fontStyle: 'italic' }}>Black Hole</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        A black hole is the simplest macroscopic object in physics: from far away, only three numbers
        describe it (mass, spin, charge). Everything else — every detail of the star that collapsed
        to form it — is lost. This is the “no-hair theorem.”
      </p>

      {/* Mass slider */}
      <div className="mb-6 p-6 rounded" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
        <div className="flex justify-between items-baseline mb-3">
          <div className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: ACCENT }}>Mass</div>
          <div className="font-display text-3xl" style={{ letterSpacing: '-0.01em' }}>
            {fmtSci(M, M < 100 ? 1 : 2)} <span className="font-mono text-base" style={{ color: DIM }}>M☉</span>
          </div>
        </div>
        <input type="range" min={0.5} max={10} step={0.01} value={logM}
               onChange={e => setLogM(parseFloat(e.target.value))} className="w-full" />
        <div className="flex justify-between mt-2 relative h-6">
          {markers.map(m => {
            const pct = (Math.log10(m.m) - 0.5) / 9.5 * 100;
            return (
              <button key={m.label} onClick={() => setLogM(Math.log10(m.m))}
                      className="absolute font-mono text-[10px] hover:text-white transition"
                      style={{ left: `${pct}%`, transform: 'translateX(-50%)', color: DIM, whiteSpace: 'nowrap' }}>
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div>
          {/* Anatomy diagram */}
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
            Anatomy (Schwarzschild geometry · top-down view)
          </div>
          <div className="relative" style={{ border: `1px solid ${BORDER}`, background: '#020208' }}>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              {/* Accretion disk (decorative) */}
              <defs>
                <radialGradient id="disk" cx="50%" cy="50%">
                  <stop offset="40%" stopColor="#ffc97a" stopOpacity="0" />
                  <stop offset="55%" stopColor="#ffc97a" stopOpacity="0.15" />
                  <stop offset="75%" stopColor="#ff8a70" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#7ac4ff" stopOpacity="0" />
                </radialGradient>
              </defs>
              <ellipse cx={cx} cy={cy} rx={rUnit * 7} ry={rUnit * 1.5} fill="url(#disk)" />

              {/* ISCO */}
              <circle cx={cx} cy={cy} r={rUnit * isco_rs} fill="none" stroke={ACCENT2} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
              <text x={cx + rUnit * isco_rs + 8} y={cy - rUnit * isco_rs - 4} fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT2}>
                ISCO · {isco_rs.toFixed(2)} r_s
              </text>

              {/* Photon sphere */}
              <circle cx={cx} cy={cy} r={rUnit * photonRadius} fill="none" stroke={ACCENT} strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
              <text x={cx + rUnit * photonRadius + 8} y={cy - rUnit * photonRadius + 16} fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT}>
                photon sphere · 1.5 r_s
              </text>

              {/* Event horizon */}
              <circle cx={cx} cy={cy} r={rUnit} fill="#000" stroke={ACCENT} strokeWidth="2" />
              <text x={cx + rUnit + 8} y={cy + 32} fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT}>
                event horizon · r_s
              </text>

              {/* Singularity */}
              <circle cx={cx} cy={cy} r="2" fill={ACCENT} />
              <line x1={cx} x2={cx + 60} y1={cy} y2={cy - 40} stroke={DIM} strokeWidth="0.5" />
              <text x={cx + 65} y={cy - 42} fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
                singularity
              </text>

              {/* Scale bar */}
              <g transform={`translate(40, ${H - 50})`}>
                <line x1="0" x2={rUnit} y1="0" y2="0" stroke={INK} strokeWidth="1" />
                <line x1="0" x2="0" y1="-4" y2="4" stroke={INK} />
                <line x1={rUnit} x2={rUnit} y1="-4" y2="4" stroke={INK} />
                <text x={rUnit / 2} y="-8" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>
                  1 r_s = {fmtSci(rs_km, 2)} km
                </text>
                <text x={rUnit / 2} y="18" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>
                  ≈ {rs_km < 1.5e6 ? `${(rs_km / 1.5e6).toFixed(3)} R☉` : `${(rs_km / 1.496e8).toFixed(2)} AU`}
                </text>
              </g>
            </svg>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mt-6" style={{ background: BORDER }}>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Schwarzschild radius</div>
              <div className="font-display text-base" style={{ color: INK }}>{fmtSci(rs_km, 2)} km</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Hawking temperature</div>
              <div className="font-display text-base" style={{ color: INK }}>{fmtSci(T_H, 2)} K</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Density (avg)</div>
              <div className="font-display text-base" style={{ color: INK }}>
                {fmtSci((M * Msun) / (4/3 * Math.PI * Math.pow(rs_km * 1000, 3)), 1)} kg/m³
              </div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Evaporation time</div>
              <div className="font-display text-base" style={{ color: INK }}>{fmtSci(t_evap, 1)} yr</div>
            </div>
          </div>

          <div className="mt-10 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <Section title="The Schwarzschild radius">
              <Eq>r<sub>s</sub> = 2GM / c²</Eq>
              <p>
                Derived in 1916 by Karl Schwarzschild from Einstein’s field equations, just weeks after
                general relativity was published. The Schwarzschild radius for a mass M is the radius at
                which gravitational time dilation becomes infinite for a distant observer — and inside
                which no signal can escape to infinity.
              </p>
              <p>
                Numerically: r<sub>s</sub> ≈ 2.95 km × (M / M☉). The Sun’s would be ~3 km. Earth’s would be
                ~9 mm. A 10 M☉ stellar-mass BH has an event horizon ~30 km across. Sagittarius A* (4.3 million M☉)
                has r<sub>s</sub> ≈ 12 million km — just a fraction of Mercury’s orbit. M87* (6.5 billion M☉)
                has r<sub>s</sub> ≈ 100 AU — larger than our solar system.
              </p>
            </Section>

            <Section title="Three radii to know">
              <p>
                <strong style={{ color: ACCENT }}>Event horizon (r = r_s)</strong> — point of no return. Crossing
                inward is irreversible. Locally there’s nothing dramatic at the horizon — tidal forces are mild
                for large BHs. The drama is geometric: future light cones tilt entirely inward.
              </p>
              <p>
                <strong style={{ color: ACCENT }}>Photon sphere (r = 1.5 r_s)</strong> — the radius at which light
                can theoretically orbit the BH. Unstable orbit. The bright ring in the Event Horizon Telescope
                images of M87* and Sgr A* is the photon sphere, lensed.
              </p>
              <p>
                <strong style={{ color: ACCENT }}>ISCO — innermost stable circular orbit (r = 3 r_s for non-spinning)</strong>
                — the closest a particle can stably orbit. Inside the ISCO, orbits are unstable; matter
                spirals inward. This is the inner edge of an accretion disk. For maximally spinning Kerr
                black holes the ISCO drops to 0.5 r_s — meaning much more efficient energy extraction
                from accreting matter (~42% rest-mass-energy efficiency vs. ~6% non-spinning).
              </p>
            </Section>

            <Section title="Hawking radiation">
              <Eq>T<sub>H</sub> = ℏc³ / (8πGMk<sub>B</sub>)</Eq>
              <p>
                In 1974 Stephen Hawking applied quantum field theory in curved spacetime and found that
                black holes are not truly black: they radiate thermal photons at a temperature inversely
                proportional to their mass.
              </p>
              <p>
                For a stellar-mass BH the temperature is ~6 × 10⁻⁸ K — utterly cold, the radiation is
                absurdly weak, and the cosmic microwave background pours more energy into the hole than
                Hawking radiation removes. Evaporation lifetime for a 10 M☉ BH: ~10⁶⁹ years. Far longer
                than the current age of the universe (~10¹⁰).
              </p>
              <p>
                Hawking radiation has never been observed and probably never will be — except potentially
                from primordial black holes lighter than ~10¹² kg, which would be ending their lives now
                in bright flashes. None have been detected.
              </p>
            </Section>

            <Section title="The “no-hair theorem”">
              <p>
                A classical black hole at equilibrium is fully described by three parameters: mass M, angular
                momentum J, and electric charge Q. Whatever fell in — books, stars, antimatter, an entire
                galactic civilisation — leaves no observable trace on the exterior. This is the no-hair
                theorem of Israel, Carter, and Hawking.
              </p>
              <p>
                The information-paradox question — what really happens to the information that fell in — is
                one of the deepest open problems in theoretical physics. Reconciling Hawking’s prediction
                (information lost) with quantum mechanics (information conserved) is widely believed to require
                a quantum theory of gravity.
              </p>
            </Section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start" style={{ borderLeft: `1px solid ${BORDER}` }}>
          <div className="pl-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>Categories of black hole</div>
            <ul className="space-y-4 font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>
              <li><strong style={{ color: ACCENT }}>Stellar-mass</strong> (3–80 M☉) — endpoints of massive-star collapse. Discovered as X-ray binaries (Cygnus X-1, 1971) and now in their hundreds via LIGO/Virgo gravitational-wave detections of mergers.</li>
              <li><strong style={{ color: ACCENT }}>Intermediate-mass</strong> (10² – 10⁵ M☉) — long predicted, rarely confirmed. Formation channel unclear: runaway collisions in dense star clusters? Direct collapse?</li>
              <li><strong style={{ color: ACCENT }}>Supermassive</strong> (10⁶ – 10¹⁰ M☉) — at the centre of essentially every massive galaxy. Origin still debated. Powers AGN and quasars when actively accreting.</li>
              <li><strong style={{ color: ACCENT }}>Primordial</strong> (hypothetical) — formed in the early universe from density fluctuations. Could span many orders of magnitude. None confirmed.</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Real photographs */}
      <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
        <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>Imaging the unimageable</h3>

        <Photo src="https://nsf-gov-resources.nsf.gov/2024-12/Event%20Horizon%20Black%20Hole%20Image.jpg"
               alt="EHT image of M87*"
               caption="The Event Horizon Telescope's 2019 image of M87* — the supermassive black hole at the centre of M87. The dark central region is the black hole's shadow, ~2.6× the Schwarzschild diameter due to gravitational lensing. The bright ring is the photon sphere illuminated by accreting plasma."
               credit="Event Horizon Telescope Collaboration" />

        <Photo src="https://nsf-gov-resources.nsf.gov/2024-12/sag-event-image.jpg"
               alt="EHT image of Sgr A*"
               caption="EHT's 2022 image of Sagittarius A* — the supermassive black hole at the centre of our own Milky Way (~4.3 × 10⁶ M☉, ~27,000 ly away). About 1,500× less massive than M87* but ~2,000× closer, so similar angular size."
               credit="Event Horizon Telescope Collaboration" />
      </div>

      <WorkedExample title="Compute the Schwarzschild radius of the Sun"
                     steps={[
                       { text: 'The Schwarzschild radius is the radius at which the escape velocity from a mass equals the speed of light. Set ½v² = GM/r with v = c.',
                         eq: 'r_s = 2GM / c²' },
                       { text: 'Plug in the Sun\'s mass (M = 1.989 × 10³⁰ kg), G = 6.674 × 10⁻¹¹ N·m²/kg², and c = 2.998 × 10⁸ m/s.',
                         eq: 'r_s = 2 × (6.674e−11) × (1.989e30) / (2.998e8)²' },
                       { text: 'Compute carefully step by step.',
                         eq: 'r_s = 2.654 × 10²⁰ / 8.988 × 10¹⁶ ≈ 2,953 m',
                         answer: '≈ 2.95 km. If the Sun collapsed into a black hole, its event horizon would be a sphere ~3 km across — about the size of a small town. Earth\'s Schwarzschild radius is just 8.8 mm.' },
                     ]} />

      <Playground
        title="Black hole calculator"
        description="Set any black hole mass and see its key parameters. Stellar-mass holes are tiny and hot (relatively speaking); supermassive holes are vast and cold."
        inputs={[
          { key: 'M', label: 'Mass', default: 10, min: 0, max: 10, log: true, unit: 'M☉' },
        ]}
        compute={(v) => {
          const G = 6.674e-11, c = 2.998e8, Msun = 1.989e30;
          const hbar = 1.055e-34, kB = 1.381e-23;
          const rs_km = 2 * G * (v.M * Msun) / (c * c) / 1000;
          const T_H = (hbar * Math.pow(c, 3)) / (8 * Math.PI * G * (v.M * Msun) * kB);
          const t_evap = 2.1e67 * Math.pow(v.M, 3);
          const density = (v.M * Msun) / ((4/3) * Math.PI * Math.pow(rs_km * 1000, 3));
          return { rs_km, T_H, t_evap, density };
        }}
        outputs={[
          { key: 'rs_km', label: 'Schwarzschild radius', unit: 'km' },
          { key: 'T_H', label: 'Hawking temperature', unit: 'K' },
          { key: 'density', label: 'Average density', unit: 'kg/m³' },
          { key: 't_evap', label: 'Evaporation time', unit: 'yr' },
        ]}
      />

      <Quiz questions={[
        { q: 'A black hole is twice as massive. Its event horizon radius is:',
          options: ['Half as large', 'Same size', 'Twice as large', 'Four times as large'],
          correct: 2,
          explain: 'r_s = 2GM/c² is linear in mass. Double the mass, double the radius. Note this means the volume goes up as M³, so density falls as M⁻². A black hole the size of our solar system would have density less than water.' },
        { q: 'Why isn\'t Hawking radiation from stellar-mass black holes observable?',
          options: ['It doesn\'t exist', 'The temperature is too low (microkelvins to nanokelvins)', 'It\'s blocked by the event horizon', 'It only escapes during mergers'],
          correct: 1,
          explain: 'T_H = ℏc³/(8πGMk_B). For a 10 M☉ BH, T_H ≈ 6 × 10⁻⁹ K. The CMB at 2.725 K pours far more energy in than Hawking radiation pours out — so these BHs are net gaining mass from the CMB alone, never evaporating until the CMB cools below T_H, in ~10²⁰ years.' },
        { q: 'What is the photon sphere?',
          options: ['The event horizon', 'The radius where light can orbit the BH (1.5 r_s)', 'The accretion disk', 'The Roche limit'],
          correct: 1,
          explain: 'At r = 1.5 r_s for a Schwarzschild BH, light can theoretically orbit in unstable circular paths. The EHT images of M87* and Sgr A* show the photon sphere as the bright ring around the dark central shadow.' },
      ]} />

      <OpenQuestions items={[
        { q: 'Where does the information go?',
          detail: '— Hawking\'s 1974 calculation suggests information falling into a black hole is destroyed when the BH evaporates. Quantum mechanics says information must be conserved. This is the "black hole information paradox" and remains one of the deepest unsolved problems in fundamental physics. Recent work on the "Page curve" and entanglement islands offers tantalising progress.' },
        { q: 'How did supermassive black holes form so quickly?',
          detail: '— We see ~10⁹ M☉ BHs at z > 7, less than a billion years after the Big Bang. Standard accretion from stellar-mass seeds is too slow. Direct collapse of pristine gas clouds into ~10⁵ M☉ "seed" BHs is the leading hypothesis, but the conditions required (no metal cooling, no fragmentation) are stringent.' },
        { q: 'Is there a "firewall" at the event horizon?',
          detail: '— The 2012 AMPS paper argued that a strict version of black hole complementarity, the equivalence principle, and unitarity cannot all be true simultaneously. The proposed resolution — that infalling observers encounter a high-energy "firewall" at the horizon — would overturn general relativity. The debate remains open.' },
        { q: 'Are LIGO\'s heavy stellar-mass BHs (~30-80 M☉) the products of normal stellar evolution?',
          detail: '— Many gravitational-wave-detected merging BHs are heavier than expected from single-star evolution at solar metallicity. Possible explanations include low-metallicity environments, dynamical formation in dense clusters, or "primordial" BHs.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  08 · GALAXY MORPHOLOGY
// ═══════════════════════════════════════════════════════════════════════════
const GALAXY_TYPES = [
  { id: 'E0', kind: 'elliptical', ba: 1.0, label: 'E0',
    name: 'E0 — round elliptical',
    mass: '10¹⁰ – 10¹³ M☉', col: 'red', sfr: 'negligible (~0)', gas: '< 1%',
    examples: 'M87, M89, NGC 1399',
    desc: 'Featureless, dominated by old red stars. Little gas or dust. Stars on randomly oriented orbits — the galaxy is pressure-supported, not rotation-supported. Common in cluster cores.' },
  { id: 'E5', kind: 'elliptical', ba: 0.5, label: 'E5',
    name: 'E5 — elongated elliptical',
    mass: '10⁹ – 10¹² M☉', col: 'red', sfr: 'negligible', gas: '< 1%',
    examples: 'M59, NGC 4365',
    desc: 'Same physics as E0 but flatter. The integer after E is 10×(1 − b/a). Most ellipticals are intrinsically triaxial; the apparent shape depends on viewing angle.' },
  { id: 'S0', kind: 'lenticular', ba: 0.35, label: 'S0',
    name: 'S0 — lenticular',
    mass: '10¹⁰ – 10¹² M☉', col: 'red', sfr: 'low (~0.1 M☉/yr)', gas: '< 5%',
    examples: 'NGC 1316, NGC 5102',
    desc: 'Disk + bulge but no spiral arms. Transitional between ellipticals and spirals. Common in clusters where ram-pressure stripping has removed the gas needed to form arms.' },
  { id: 'Sa', kind: 'spiral', bulge: 0.45, pitch: 8, arms: 2, label: 'Sa',
    name: 'Sa — tightly wound spiral',
    mass: '10¹⁰ – 10¹² M☉', col: 'red-ish', sfr: '~1 M☉/yr', gas: '~5%',
    examples: 'M104 (Sombrero), NGC 4274',
    desc: 'Prominent bulge + tightly wound arms. The bulge is essentially a small elliptical embedded in a disk — and behaves like one (old red stars, low SFR).' },
  { id: 'Sb', kind: 'spiral', bulge: 0.25, pitch: 15, arms: 2, label: 'Sb',
    name: 'Sb — intermediate spiral',
    mass: '10¹⁰ – 10¹² M☉', col: 'blue-ish', sfr: '~3 M☉/yr', gas: '~10%',
    examples: 'M31 (Andromeda), Milky Way (~Sbc)',
    desc: 'Moderate bulge, well-defined two-armed structure. Spiral arms are density waves — pile-ups of gas and young stars moving more slowly than disk material orbits.' },
  { id: 'Sc', kind: 'spiral', bulge: 0.12, pitch: 25, arms: 4, label: 'Sc',
    name: 'Sc — loosely wound spiral',
    mass: '10⁹ – 10¹¹ M☉', col: 'blue', sfr: '~5–10 M☉/yr', gas: '~20%',
    examples: 'M101 (Pinwheel), M51 (Whirlpool)',
    desc: 'Small bulge, loose multi-arm structure, vigorous star formation. The blue colour comes from massive O/B stars (lifetime ~10⁷ yr) — seeing them means the galaxy is making them now.' },
  { id: 'SBa', kind: 'barred', bulge: 0.4, pitch: 8, arms: 2, label: 'SBa',
    name: 'SBa — barred, tight',
    mass: '10¹⁰ – 10¹² M☉', col: 'red-ish', sfr: '~1 M☉/yr', gas: '~5%',
    examples: 'NGC 1300, NGC 2217',
    desc: 'A bar across the centre + tightly wound arms. ~half of all disk galaxies have bars, including the Milky Way. Bars funnel gas inward, fuelling central star formation and AGN.' },
  { id: 'SBb', kind: 'barred', bulge: 0.22, pitch: 16, arms: 2, label: 'SBb',
    name: 'SBb — barred, intermediate',
    mass: '10¹⁰ – 10¹² M☉', col: 'mixed', sfr: '~3 M☉/yr', gas: '~10%',
    examples: 'NGC 1365, NGC 1530',
    desc: 'Strong bar + moderate arms. The Milky Way is somewhere between SBb and SBc. Bars are not permanent — they can form and dissolve over Gyr.' },
  { id: 'SBc', kind: 'barred', bulge: 0.1, pitch: 26, arms: 4, label: 'SBc',
    name: 'SBc — barred, loose',
    mass: '10⁹ – 10¹¹ M☉', col: 'blue', sfr: '~5 M☉/yr', gas: '~20%',
    examples: 'NGC 1073, NGC 1313',
    desc: 'Strong bar, loosely wound arms, high SFR. Bars set up dynamical resonances that organise star-forming regions in characteristic patterns.' },
  { id: 'Irr', kind: 'irregular', label: 'Irr',
    name: 'Irr — irregular',
    mass: '10⁷ – 10¹⁰ M☉', col: 'blue', sfr: '~0.1–1 M☉/yr', gas: '~30–50%',
    examples: 'LMC, SMC, NGC 4449',
    desc: 'No clear morphology. Often dwarfs, sometimes tidally disrupted larger systems. Very gas-rich and star-forming. The Magellanic Clouds are the prototypes — and on close inspection show structure earlier classifications missed.' },
];

function GalaxySVG({ type, size = 80 }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.4;
  const gradId = `gg-${type.id}-${size}`;

  if (type.kind === 'elliptical') return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0%" stopColor="#fff8e0" />
          <stop offset="50%" stopColor="#ffd2a1" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#a0604a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={r} ry={r * type.ba} fill={`url(#${gradId})`} />
    </svg>
  );

  if (type.kind === 'lenticular') return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <radialGradient id={gradId}>
          <stop offset="0%" stopColor="#fff8e0" />
          <stop offset="100%" stopColor="#ffd2a1" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={r * 1.1} ry={r * type.ba * 0.5} fill="#ffd2a1" opacity="0.3" />
      <ellipse cx={cx} cy={cy} rx={r * 0.45} ry={r * 0.45} fill={`url(#${gradId})`} />
    </svg>
  );

  if (type.kind === 'spiral' || type.kind === 'barred') {
    const pitch_rad = type.pitch * Math.PI / 180;
    const b = Math.tan(pitch_rad);
    const arms = [];
    for (let i = 0; i < type.arms; i++) {
      const startAngle = (i * 2 * Math.PI / type.arms);
      const startR = type.kind === 'barred' ? r * 0.4 : r * type.bulge * 1.1;
      const points = [];
      for (let theta = 0; theta < Math.PI * 2.5; theta += 0.08) {
        const armR = startR * Math.exp(b * theta);
        if (armR > r) break;
        const angle = theta + startAngle;
        const x = cx + armR * Math.cos(angle);
        const y = cy + armR * Math.sin(angle);
        points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
      arms.push(points.join(' '));
    }
    return (
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <radialGradient id={gradId}>
            <stop offset="0%" stopColor="#fff8e0" />
            <stop offset="100%" stopColor="#ffd2a1" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r * 0.95} fill="#3a4a6a" opacity="0.12" />
        {arms.map((p, i) => (
          <polyline key={i} points={p} fill="none" stroke="#7ac4ff" strokeWidth={size > 80 ? 1.6 : 1.2} opacity="0.75" strokeLinecap="round" />
        ))}
        {type.kind === 'barred' && (
          <rect x={cx - r * 0.42} y={cy - r * 0.08} width={r * 0.84} height={r * 0.16}
                fill={`url(#${gradId})`} rx={r * 0.08}
                transform={`rotate(0 ${cx} ${cy})`} />
        )}
        <ellipse cx={cx} cy={cy} rx={r * type.bulge} ry={r * type.bulge * 0.95} fill={`url(#${gradId})`} />
      </svg>
    );
  }

  // irregular
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <path d={`M ${cx-r*0.6} ${cy-r*0.3}
               Q ${cx-r*0.3} ${cy-r*0.7}, ${cx} ${cy-r*0.5}
               Q ${cx+r*0.5} ${cy-r*0.4}, ${cx+r*0.6} ${cy}
               Q ${cx+r*0.4} ${cy+r*0.55}, ${cx+r*0.1} ${cy+r*0.6}
               Q ${cx-r*0.4} ${cy+r*0.5}, ${cx-r*0.6} ${cy+r*0.2}
               Q ${cx-r*0.8} ${cy-r*0.1}, ${cx-r*0.6} ${cy-r*0.3} Z`}
            fill="#7ac4ff" opacity="0.4" />
      {[[-0.3, -0.2], [0.2, -0.3], [0.3, 0.2], [-0.2, 0.3], [0.05, 0.05]].map(([dx, dy], i) => (
        <circle key={i} cx={cx + r * dx} cy={cy + r * dy} r="2" fill="#aabfff" opacity="0.9" />
      ))}
    </svg>
  );
}

function GalaxyMorph({ onBack }) {
  const [sel, setSel] = useState('Sb');
  const g = GALAXY_TYPES.find(t => t.id === sel);

  // Tuning fork layout positions
  const FORK = {
    E0: { x: 60, y: 200 }, E5: { x: 150, y: 200 }, S0: { x: 280, y: 200 },
    Sa: { x: 400, y: 110 }, Sb: { x: 550, y: 110 }, Sc: { x: 700, y: 110 },
    SBa: { x: 400, y: 290 }, SBb: { x: 550, y: 290 }, SBc: { x: 700, y: 290 },
    Irr: { x: 830, y: 200 },
  };
  const W = 900, H = 400;

  return (
    <PageShell onBack={onBack} eyebrow="13 — Extragalactic Astronomy"
               title={<>Galaxy <em style={{ color: ACCENT, fontStyle: 'italic' }}>Morphology</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Edwin Hubble’s 1936 classification of galaxies into ellipticals, lenticulars, spirals, barred
        spirals, and irregulars was the first attempt to bring order to an unfamiliar zoo. The diagram
        is called a “tuning fork.” It is not an evolutionary sequence — but morphology still encodes
        an enormous amount of physics.
      </p>

      {/* Tuning fork */}
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
        The Hubble tuning fork
      </div>
      <div className="relative" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* Connecting lines */}
          <g stroke={BORDER_STRONG} strokeWidth="1" fill="none">
            <line x1="60" x2="280" y1="200" y2="200" />
            <line x1="280" x2="400" y1="200" y2="110" />
            <line x1="280" x2="400" y1="200" y2="290" />
            <line x1="400" x2="700" y1="110" y2="110" />
            <line x1="400" x2="700" y1="290" y2="290" />
            <line x1="700" x2="830" y1="110" y2="200" strokeDasharray="3 4" />
            <line x1="700" x2="830" y1="290" y2="200" strokeDasharray="3 4" />
          </g>
          {/* Branch labels */}
          <text x="220" y="180" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                fontSize="9" fill={DIM} letterSpacing="0.18em">ELLIPTICALS → LENTICULAR</text>
          <text x="550" y="60" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                fontSize="9" fill={DIM} letterSpacing="0.18em">SPIRALS</text>
          <text x="550" y="350" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                fontSize="9" fill={DIM} letterSpacing="0.18em">BARRED SPIRALS</text>
          {/* Galaxies */}
          {GALAXY_TYPES.map(t => {
            const p = FORK[t.id];
            const isSel = sel === t.id;
            return (
              <g key={t.id} onClick={() => setSel(t.id)} style={{ cursor: 'pointer' }}>
                {isSel && <circle cx={p.x} cy={p.y} r="45" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.5" />}
                <g transform={`translate(${p.x - 40}, ${p.y - 40})`}>
                  <GalaxySVG type={t} size={80} />
                </g>
                <text x={p.x} y={p.y + 60} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                      fontSize="11" fill={isSel ? ACCENT : INK}>{t.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] mt-3" style={{ color: DIM }}>
        Click any galaxy type
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 mt-10 fade-in" key={sel}>
        <div>
          <div className="flex items-start gap-6 mb-8">
            <div style={{ minWidth: 140 }}>
              <GalaxySVG type={g} size={140} />
            </div>
            <div>
              <h2 className="font-display text-3xl mb-2 leading-tight" style={{ letterSpacing: '-0.01em' }}>{g.name}</h2>
              <div className="font-mono text-xs" style={{ color: DIM }}>Examples: {g.examples}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-10" style={{ background: BORDER }}>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Typical mass</div>
              <div className="font-display text-sm" style={{ color: INK }}>{g.mass}</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Colour</div>
              <div className="font-display text-sm" style={{ color: INK }}>{g.col}</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Star formation</div>
              <div className="font-display text-sm" style={{ color: INK }}>{g.sfr}</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Gas fraction</div>
              <div className="font-display text-sm" style={{ color: INK }}>{g.gas}</div>
            </div>
          </div>

          <div className="pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
            <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>The physics behind morphology</h3>

            <Section title="The tuning fork is not evolutionary">
              <p>
                Hubble called ellipticals “early type” and spirals “late type,” and the labels stuck — but
                his hunch that galaxies evolve from one to the other was wrong. We now know it’s closer to
                the opposite: gas-rich star-forming disks (spirals) can be transformed into red-and-dead
                ellipticals by mergers, gas stripping, and quenching of star formation. The arrow of time
                runs from <em>blue cloud</em> to <em>red sequence</em>, not from E0 to Sc.
              </p>
            </Section>

            <Section title="The colour–magnitude diagram: red sequence, blue cloud, green valley">
              <p>
                Plot galaxies by their integrated colour vs absolute magnitude and they fall into two
                concentrations: a tight <strong style={{ color: '#ff8a70' }}>red sequence</strong> of passive
                galaxies (mostly ellipticals and S0s) and a more diffuse <strong style={{ color: '#7ac4ff' }}>blue cloud</strong>
                of star-forming galaxies (mostly spirals). The sparsely populated region between them is the
                <em> green valley</em> — galaxies in the act of quenching, transitioning from one population
                to the other in ~1 Gyr.
              </p>
              <p>
                Galaxies leave the blue cloud when they stop making new stars. Their old populations fade and
                redden, and they settle onto the red sequence. The mechanisms that quench star formation are
                still actively debated: AGN feedback, ram-pressure stripping in clusters, “strangulation” of
                the gas supply, major mergers, halo quenching above a critical halo mass (~10¹² M☉).
              </p>
            </Section>

            <Section title="The morphology–density relation">
              <p>
                Galaxy morphology depends strongly on environment. In rich clusters, the population is
                dominated by ellipticals and S0s. In low-density fields, spirals dominate. Spelled out by
                Alan Dressler in 1980 from data on 55 clusters.
              </p>
              <p>
                Three physical effects probably drive this: (1) cluster galaxies are continually stripped of
                their gas reservoirs by hot intracluster medium, halting star formation; (2) frequent
                gravitational encounters disrupt cold disks; (3) at the very centre of a cluster, the
                <em> brightest cluster galaxy</em> grows by cannibalising smaller galaxies — a “cD” elliptical
                with extended diffuse envelope is the endpoint of many mergers.
              </p>
            </Section>

            <Section title="Spiral arms are density waves, not material objects">
              <p>
                A naive picture: stars in a spiral arm orbit the galaxy with the arm. This is wrong, and
                leads to a problem: differential rotation would wind the arms up into a tight pinwheel in
                only ~10⁸ years. We see well-defined arms in galaxies billions of years old.
              </p>
              <p>
                The resolution (Lin–Shu density wave theory, 1964): spiral arms are <em>patterns</em>, not
                objects. They are regions of slightly enhanced density that move through the disk at the
                pattern speed Ω<sub>p</sub>. Gas and stars move through them — speeding up as they enter,
                slowing as they leave — like cars driving through a slow-moving traffic jam. The jam
                persists even though no individual car stays in it.
              </p>
              <Eq>
                Co-rotation radius:  R<sub>CR</sub> where Ω(R) = Ω<sub>p</sub>
              </Eq>
              <p>
                Inside co-rotation, stars overtake the pattern; outside, the pattern overtakes them. At the
                co-rotation radius, the gas sits stationary in the arms — and that’s where you see the most
                prominent star formation. The shock of gas piling up as it crosses the arm compresses
                molecular clouds and triggers collapse — hence the strings of blue H II regions along arms.
              </p>
            </Section>

            <Section title="Active galactic nuclei">
              <p>
                Essentially every massive galaxy hosts a supermassive black hole at its centre. When that
                BH is actively accreting, it powers an AGN — a quasar or Seyfert nucleus that can outshine
                the entire stellar content of its host galaxy. The Milky Way’s central BH (Sgr A*, 4.3 × 10⁶
                M☉) is currently very faint; it is not actively accreting.
              </p>
              <p>
                The mass of the central BH correlates tightly with the velocity dispersion σ of the bulge —
                the <em>M–σ relation</em> — implying co-evolution of BHs and their host galaxies, despite
                BHs being ~10⁻³ of the bulge mass and gravitationally dominant only over a tiny region:
              </p>
              <Eq>M<sub>BH</sub> ≈ 10⁸ M☉ × (σ / 200 km/s)<sup>4.4</sup></Eq>
              <p>
                AGN feedback — energy and momentum injected into the host galaxy by the accreting BH — is
                probably one of the main ways star formation is quenched in massive galaxies.
              </p>
            </Section>

            <Section title="Beyond the tuning fork">
              <p>
                The original Hubble classification was based on photographic plates of nearby galaxies. Modern
                surveys have revealed structure Hubble couldn’t see: rings, lopsided disks, dwarf
                spheroidals, ultra-diffuse galaxies, galaxies in tidal tails, post-merger remnants. Citizen-science
                projects (Galaxy Zoo) and machine learning have produced morphological classifications for
                millions of galaxies. The picture that emerges is one of gradients — concentration, asymmetry,
                Sérsic index — rather than discrete bins.
              </p>
            </Section>
          </div>
        </div>

        <aside className="lg:sticky lg:top-6 self-start" style={{ borderLeft: `1px solid ${BORDER}` }}>
          <div className="pl-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>What this type is</div>
            <p className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{g.desc}</p>
            <div className="mt-6 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] leading-relaxed" style={{ color: DIM, borderTop: `1px solid ${BORDER}` }}>
              Schematic only. Real galaxies look dramatically different in colour and detail; survey images
              are essential to develop intuition (try Galaxy Zoo, SDSS Navigator).
            </div>
          </div>
        </aside>
      </div>

      {/* Real photographs */}
      <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
        <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>The real thing</h3>

        <Photo src="https://science.nasa.gov/wp-content/uploads/2023/07/m31.jpg"
               alt="Andromeda Galaxy (M31)"
               caption="The Andromeda Galaxy (M31), the Milky Way's nearest major neighbour at ~765 kpc. Hubble's 1924 detection of Cepheids in this galaxy settled the Great Debate by proving it lay far outside the Milky Way. This is the largest Hubble mosaic of M31 to date, assembled from 7,398 individual exposures."
               credit="NASA, ESA, J. Dalcanton, B.F. Williams, and L.C. Johnson (UW), the PHAT team, and R. Gendler" />

        <Photo src="https://science.nasa.gov/wp-content/uploads/2023/04/m101-jpg.webp"
               alt="Pinwheel Galaxy (M101)"
               caption="The Pinwheel Galaxy (M101), a textbook Sc spiral seen nearly face-on. The bright pink knots are HII regions — vast clouds of ionised hydrogen lit up by clusters of young, massive stars."
               credit="NASA, ESA, K.D. Kuntz (JHU), F. Bresolin (University of Hawaii), J. Trauger (JPL), J. Mould (NOAO), Y.-H. Chu (University of Illinois, Urbana), and STScI" />

        <Photo src="https://science.nasa.gov/wp-content/uploads/2023/04/m87-jet-jpg.webp"
               alt="M87 elliptical galaxy with jet"
               caption="M87, a giant elliptical galaxy at the centre of the Virgo Cluster. The bright bluish jet is a relativistic outflow from the supermassive black hole (~6.5 × 10⁹ M☉) at its core — the same black hole imaged by the Event Horizon Telescope in 2019."
               credit="NASA and The Hubble Heritage Team (STScI/AURA)" />
      </div>

      <OpenQuestions items={[
        { q: 'How were the first galaxies built?',
          detail: '— JWST is finding luminous galaxies at z > 10 (less than 500 Myr after the Big Bang) that look more massive and more evolved than ΛCDM predicts. Either galaxies formed faster than expected, the stellar masses are being overestimated, or something fundamental about early structure formation is off.' },
        { q: 'What\'s the dominant mechanism for "quenching" star formation in massive galaxies?',
          detail: '— Multiple candidates: AGN feedback, halo quenching above ~10¹² M☉, stripping in clusters. Different galaxies probably use different mechanisms — but disentangling which dominates where remains an active research area.' },
        { q: 'Why are spiral arms so persistent?',
          detail: '— Density-wave theory works in broad strokes but has trouble explaining how spiral patterns are sustained over many galactic rotations. Modern theories (transient spiral instabilities, swing amplification) better match simulations but the full picture isn\'t settled.' },
        { q: 'What is the true incidence of intermediate-mass black holes (10² – 10⁵ M☉)?',
          detail: '— We have abundant evidence for stellar-mass BHs and supermassive BHs, but the intermediate-mass regime is sparsely populated. Whether this is because they\'re truly rare, or just hard to detect, has implications for how supermassive BHs grew.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  09 · BIG BANG TIMELINE
// ═══════════════════════════════════════════════════════════════════════════
// Each epoch: logT in seconds (start), name, T in K, brief
const EPOCHS = [
  { id: 'planck', logT: -43, name: 'Planck era', temp: '> 10³² K',
    short: 'All four forces unified; quantum gravity dominates. No known physics applies.',
    detail: `The earliest moment we can meaningfully discuss. Below ~10⁻⁴³ s the Schwarzschild radius corresponding to the energy density becomes comparable to the Compton wavelength — meaning gravity becomes a quantum theory we do not yet have. Whatever happened here requires a theory beyond general relativity and quantum field theory. Strings, loop quantum gravity, asymptotic safety, causal sets — all candidates, none confirmed.` },
  { id: 'gut', logT: -36, name: 'GUT epoch ends', temp: '~10²⁸ K',
    short: 'Gravity already decoupled; strong force separates from electroweak.',
    detail: `Above ~10¹⁶ GeV the strong and electroweak interactions are predicted (by various Grand Unified Theories) to merge into one. Below it they separate. The transition could have produced topological defects: cosmic strings, monopoles, domain walls. We don’t see them — which inflation later explains.` },
  { id: 'infl', logT: -34, name: 'Inflation', temp: 'variable',
    short: 'Universe expands by a factor of ~10²⁶ in ~10⁻³³ seconds. Sets flatness and homogeneity.',
    detail: `Proposed by Alan Guth (1980) to solve three puzzles: flatness, horizon, monopole. A scalar field (the inflaton) drives a brief epoch of exponential expansion, blowing up sub-horizon quantum fluctuations to cosmic scales. Those fluctuations are the seeds of every galaxy, cluster, and CMB anisotropy we observe today. The slight tilt of the primordial power spectrum (n_s ≈ 0.965) is consistent with single-field slow-roll inflation. The mechanism that ended inflation (“reheating”) converted the inflaton energy into a hot bath of standard-model particles.` },
  { id: 'ew', logT: -12, name: 'Electroweak symmetry breaking', temp: '~10¹⁵ K',
    short: 'The Higgs field acquires its vacuum expectation value. Particles get mass.',
    detail: `Above this temperature the W, Z, and photon are all massless gauge bosons of an unbroken SU(2)×U(1) symmetry. Below it, the Higgs field condenses, the W and Z become massive (~80 and ~91 GeV), and the photon stays massless. Fundamental fermions also acquire mass through their Higgs couplings. This is well-tested physics — it’s what the LHC does.` },
  { id: 'qh', logT: -5, name: 'Quark–hadron transition', temp: '~10¹² K',
    short: 'Free quarks confine into protons, neutrons, mesons.',
    detail: `Above this temperature, quarks and gluons exist as a deconfined plasma — the same state of matter recreated briefly in RHIC and LHC heavy-ion collisions. As the universe cools, QCD confines them into hadrons. The matter–antimatter asymmetry that survives this phase (~one part in 10⁹) determines all the baryonic matter we see today.` },
  { id: 'nu', logT: 0, name: 'Neutrino decoupling', temp: '~10¹⁰ K',
    short: 'Neutrinos stop interacting and begin free-streaming.',
    detail: `Weak interactions become too slow to keep neutrinos in equilibrium with the rest of the plasma. They decouple at t ≈ 1 s and stream freely ever since. This cosmic neutrino background (CNB) still exists today, redshifted to ~1.95 K. It has never been directly detected — but its energy density and equation of state are visible in the CMB, providing one of the cleanest tests of standard cosmology.` },
  { id: 'bbn', logT: 2, name: 'Big Bang nucleosynthesis', temp: '~10⁹ K',
    short: 'In a ~20-minute window, light nuclei form: D, ³He, ⁴He, ⁷Li.',
    detail: `Once the temperature drops below ~10⁹ K, deuterium can survive (no longer instantly photodissociated). The rapid reaction network produces ~24–25% ⁴He by mass, ~10⁻⁵ D, ~10⁻⁵ ³He, ~10⁻¹⁰ ⁷Li. The predicted abundances depend on a single parameter — the baryon-to-photon ratio η — and the observed values agree spectacularly with the η inferred independently from CMB anisotropies. BBN is one of the three great pillars of Big Bang cosmology (with CMB and Hubble expansion). A persistent “lithium problem” — observed ⁷Li ~3× lower than predicted — remains unresolved.` },
  { id: 'mre', logT: 11.2, name: 'Matter–radiation equality', temp: '~10,000 K',
    short: 'Matter density catches up to radiation density. Structure can begin to grow.',
    detail: `Earlier, the universe is radiation-dominated and the rapid expansion suppresses growth of density perturbations. After equality (z ≈ 3400, t ≈ 50,000 yr), the universe is matter-dominated; dark-matter perturbations grow linearly with the scale factor and can collapse into halos. The angular scale of the largest CMB acoustic peak is sensitive to the redshift of equality, providing a direct measurement.` },
  { id: 'rec', logT: 13.1, name: 'Recombination · CMB released', temp: '~3,000 K',
    short: 'Electrons combine with nuclei into neutral atoms. Photons stream freely.',
    detail: `Hydrogen and helium become neutral when the universe cools to ~3000 K (380,000 yr after the Big Bang, z ≈ 1090). Before this, the universe was an opaque plasma — photons scattered off free electrons every ~1 cm. After it, photons free-stream — and what they encountered last (the “surface of last scattering”) we now observe as the cosmic microwave background, redshifted from 3000 K to 2.725 K. Tiny temperature anisotropies in the CMB (~10⁻⁵) imprint the density fluctuations that became all subsequent structure.` },
  { id: 'dark', logT: 14, name: 'The Dark Ages', temp: 'cooling',
    short: 'Universe is neutral, transparent, and starless. Cold and dark.',
    detail: `For ~150 Myr after recombination, the only light source is the redshifting CMB itself. Hydrogen atoms float in the dark. Dark matter perturbations continue to collapse into halos, and within those halos baryons begin to cool and pool. The first stars are forming, but have not yet ignited. This era is essentially unobservable in light — but the 21 cm radio line of neutral hydrogen carries information, and dedicated experiments (EDGES, SARAS, future LuSEE-Lite on the lunar far side) are working to detect it.` },
  { id: 'firststars', logT: 15.7, name: 'First stars · Cosmic Dawn', temp: '~30 K',
    short: 'Population III stars ignite. Reionization begins.',
    detail: `The first stars — “Population III” — form from pristine H/He gas (no metals, no dust, no molecular coolants except H₂). With no efficient cooling, they were probably very massive (~30–300 M☉), short-lived, and intensely ionising. JWST is now observing galaxies at z ≈ 10–14 that probably contain the first stellar populations, and may soon catch genuine Pop III stars in lensed fields.` },
  { id: 'reion', logT: 16.5, name: 'Reionization complete', temp: '~10 K (CMB)',
    short: 'UV from first stars/galaxies fully reionises the intergalactic medium.',
    detail: `Starting around z ≈ 15 and completing by z ≈ 6 (~1 Gyr after the Big Bang), the UV output of the first stars, galaxies, and quasars reionises the cosmic neutral hydrogen. The universe becomes transparent to UV photons. Quasar absorption spectra (the “Gunn–Peterson trough”) show the tail end of this transition. The exact contribution of galaxies vs AGN to reionization is still being measured.` },
  { id: 'mwgalassemble', logT: 17.0, name: 'Galaxy & structure assembly', temp: '~3 K',
    short: 'Major galaxy mergers; cosmic noon at z ≈ 2 (~10 Gyr ago).',
    detail: `Most of the universe’s stellar mass was assembled between z ≈ 3 and z ≈ 1. The cosmic star-formation rate density peaked around z ≈ 2 at ~10× today’s rate — “cosmic noon.” The Milky Way’s thick disk was forming around then. By z ≈ 1 (8 Gyr ago) galaxy morphologies looked recognisably like today’s.` },
  { id: 'sun', logT: 17.27, name: 'Solar system forms', temp: '2.74 K (CMB)',
    short: 'Sun, Earth, and planets coalesce from a collapsing molecular cloud.',
    detail: `9.2 billion years after the Big Bang, ~4.6 billion years ago, a region of a giant molecular cloud in the Milky Way collapsed and formed the Sun and a circumstellar disk. The disk’s heavier elements — by mass mostly oxygen, carbon, and iron — had been synthesised in stars that lived and died over the previous 9 Gyr. Earth condensed at ~1 AU, just inside the snow line.` },
  { id: 'now', logT: 17.64, name: 'Today', temp: '2.725 K (CMB)',
    short: '13.8 Gyr after the Big Bang. Dark energy dominates the expansion.',
    detail: `The expansion has been accelerating for ~5 Gyr (since z ≈ 0.7), driven by what we call dark energy — observationally consistent with a cosmological constant Λ. Total energy budget (ΛCDM): ~68% dark energy, ~27% dark matter, ~5% ordinary matter. Of that 5%, only ~10% is in stars; the rest is in diffuse gas in galaxies and the intergalactic medium. The universe is roughly halfway through its star-forming life.` },
];

function BigBangTimeline({ onBack }) {
  const [sel, setSel] = useState('rec');
  const epoch = EPOCHS.find(e => e.id === sel);

  const W = 900, H = 110;
  const PL = 40, PR = 860;
  const logMin = -45, logMax = 18.5;
  const xLog = lt => PL + (PR - PL) * (lt - logMin) / (logMax - logMin);

  function fmtTime(logT) {
    const t = Math.pow(10, logT);
    if (t < 1e-30) return `10${supExp(logT)} s`;
    if (t < 1) return `10${supExp(logT)} s`;
    if (t < 60) return `${t.toFixed(0)} s`;
    if (t < 3600) return `${(t / 60).toFixed(0)} min`;
    if (t < 86400) return `${(t / 3600).toFixed(0)} h`;
    if (t < 86400 * 365.25) return `${(t / 86400).toFixed(0)} d`;
    const yr = t / (86400 * 365.25);
    if (yr < 1e6) return `${fmt(yr, 0)} yr`;
    if (yr < 1e9) return `${(yr / 1e6).toFixed(0)} Myr`;
    return `${(yr / 1e9).toFixed(2)} Gyr`;
  }
  function supExp(logT) {
    const e = Math.round(logT);
    const sign = e < 0 ? '⁻' : '';
    return sign + String(Math.abs(e)).split('').map(c => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('');
  }

  return (
    <PageShell onBack={onBack} eyebrow="14 — Cosmology"
               title={<>The <em style={{ color: ACCENT, fontStyle: 'italic' }}>Big Bang</em> Timeline</>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        The history of the universe spans 62 orders of magnitude in time — from the Planck era at
        10⁻⁴³ seconds to the present day at 4.4 × 10¹⁷ seconds. The only honest way to show that is
        on a logarithmic axis. Most of the dramatic physics happens in the first few seconds.
      </p>

      {/* Log timeline */}
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
        Log-time axis · click any epoch
      </div>
      <div className="relative" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* Axis */}
          <line x1={PL} x2={PR} y1={H/2} y2={H/2} stroke={DIM} strokeWidth="1" />
          {/* Decade marks */}
          {[-40, -30, -20, -10, 0, 10, 17].map(e => (
            <g key={e}>
              <line x1={xLog(e)} x2={xLog(e)} y1={H/2 - 4} y2={H/2 + 4} stroke={DIM} />
              <text x={xLog(e)} y={H/2 + 22} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                    fontSize="9" fill={DIM}>10{supExp(e)}s</text>
            </g>
          ))}
          {/* Epochs */}
          {EPOCHS.map(e => {
            const x = xLog(e.logT);
            const isSel = sel === e.id;
            return (
              <g key={e.id} onClick={() => setSel(e.id)} style={{ cursor: 'pointer' }}>
                <line x1={x} x2={x} y1={H/2 - 18} y2={H/2 + 4} stroke={isSel ? ACCENT : INK} strokeWidth={isSel ? 2 : 1} opacity={isSel ? 1 : 0.6} />
                <circle cx={x} cy={H/2 - 18} r={isSel ? 4 : 2.5} fill={isSel ? ACCENT : INK} opacity={isSel ? 1 : 0.6} />
              </g>
            );
          })}
          {/* Labels for key epochs */}
          <text x={xLog(-43)} y={20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={DIM}>Planck</text>
          <text x={xLog(-34)} y={20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={DIM}>inflation</text>
          <text x={xLog(2)} y={20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={DIM}>BBN</text>
          <text x={xLog(13.1)} y={20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={DIM}>CMB</text>
          <text x={xLog(17.0)} y={20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={DIM}>galaxies</text>
          <text x={xLog(17.64)} y={20} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="8" fill={ACCENT}>now</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 mt-10">
        {/* Epoch list */}
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>Epochs</div>
          <div className="space-y-px" style={{ background: BORDER }}>
            {EPOCHS.map(e => (
              <button key={e.id} onClick={() => setSel(e.id)}
                      className="w-full text-left p-3 transition"
                      style={{ background: sel === e.id ? `${ACCENT}10` : BG,
                               borderLeft: sel === e.id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
                <div className="font-display text-sm leading-tight" style={{ color: sel === e.id ? ACCENT : INK }}>{e.name}</div>
                <div className="font-mono text-[10px] mt-1" style={{ color: DIM }}>{fmtTime(e.logT)} · {e.temp}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Epoch detail */}
        <div className="fade-in" key={sel}>
          <div className="flex items-baseline gap-3 mb-2">
            <Pill>{fmtTime(epoch.logT)}</Pill>
            <span className="font-mono text-xs" style={{ color: DIM }}>T = {epoch.temp}</span>
          </div>
          <h2 className="font-display text-4xl mb-4 leading-tight" style={{ letterSpacing: '-0.01em' }}>{epoch.name}</h2>
          <p className="font-display text-lg italic mb-6" style={{ color: '#c8c3b1' }}>{epoch.short}</p>
          <p className="font-display text-base leading-relaxed" style={{ color: '#c8c3b1' }}>{epoch.detail}</p>
        </div>
      </div>

      <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
        <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>The framework: ΛCDM cosmology</h3>

        <Section title="The Friedmann equations">
          <p>
            General relativity applied to a homogeneous, isotropic universe gives two key equations.
            The first relates the expansion rate H = ȧ/a to the energy density:
          </p>
          <Eq>H² = (8πG/3) ρ − k c²/a² + Λc²/3</Eq>
          <p>
            Here ρ is total energy density, k is the spatial curvature (we measure k ≈ 0 — the universe
            is flat to high precision), and Λ is the cosmological constant. The second equation gives
            the acceleration:
          </p>
          <Eq>ä/a = −(4πG/3)(ρ + 3p/c²) + Λc²/3</Eq>
          <p>
            Note the curious term <em>3p</em>. Pressure gravitates. For ordinary matter pressure is
            negligible. For radiation, p = ρc²/3 and the deceleration term is enhanced. For dark energy
            modelled as Λ, the effective pressure is <em>negative</em> (p = −ρc²) — and the universe accelerates.
          </p>
        </Section>

        <Section title="The three eras of cosmic expansion">
          <p>
            Different components of the energy budget dilute differently as the universe expands:
            radiation density ∝ a⁻⁴ (one factor from photon density, one from redshift), matter density
            ∝ a⁻³ (just dilution), dark energy density is constant if it’s a cosmological constant.
          </p>
          <p>
            <strong style={{ color: ACCENT }}>Radiation-dominated</strong> (t &lt; 50,000 yr): a ∝ t<sup>1/2</sup>.<br />
            <strong style={{ color: ACCENT }}>Matter-dominated</strong> (50,000 yr &lt; t &lt; ~9 Gyr): a ∝ t<sup>2/3</sup>.<br />
            <strong style={{ color: ACCENT }}>Dark-energy-dominated</strong> (t &gt; ~9 Gyr): a ∝ e<sup>Ht</sup> asymptotically.
          </p>
        </Section>

        <Section title="What we know, and what we don’t">
          <p>
            <strong style={{ color: ACCENT }}>Solid:</strong> the universe is expanding; the expansion was
            decelerating, now accelerating; structure grew from tiny inflationary seeds; element abundances
            match BBN; the CMB matches a 2.725 K blackbody to extraordinary precision; cosmic microwave,
            optical, and large-scale-structure data are mutually consistent within ΛCDM.
          </p>
          <p>
            <strong style={{ color: ACCENT }}>Open:</strong> what dark matter is (no laboratory detection
            despite 40 years of trying); what dark energy is (a cosmological constant works empirically but
            its predicted value from quantum field theory is wrong by ~120 orders of magnitude); what drove
            inflation; why there is more matter than antimatter; the source of the ~5σ Hubble tension between
            local and CMB measurements of H₀.
          </p>
        </Section>

        <Playground
          title="Look-back time and the size of the observable universe"
          description="From redshift z to age, distance, and the scale factor a = 1/(1+z). Try z = 0 (now), z = 0.5 (~5 Gyr ago), z = 1 (~8 Gyr ago), z = 6 (first stars), z = 1100 (CMB)."
          inputs={[
            { key: 'z', label: 'Redshift z', default: 1, min: -2, max: 3.05, log: true, unit: '' },
          ]}
          compute={(v) => {
            const a = 1 / (1 + v.z);
            // Crude H0 = 70 km/s/Mpc → 1/H0 = 14.4 Gyr Hubble time
            // For matter-dominated approx: t = (2/3) H0^-1 (1+z)^(-3/2)
            // For ΛCDM, more complex. Use a reasonable lookback-time approximation:
            // valid roughly: for z<<1, t_LB ≈ z/H0; for z>>1 matter-dom, t_age ≈ (2/3) H0^-1 (1+z)^(-3/2)
            const H0_inv_Gyr = 14.4;
            let t_age_Gyr;
            if (v.z < 0.5) t_age_Gyr = 13.8 - v.z * H0_inv_Gyr * (1 - v.z * 0.4);
            else t_age_Gyr = (2/3) * H0_inv_Gyr * Math.pow(1 + v.z, -1.5);
            const t_LB_Gyr = 13.8 - t_age_Gyr;
            // Comoving distance approximation (very rough): d_C ≈ c/H0 * 2 * [1 - (1+z)^-0.5] for matter-dom
            const c_Hubble_Mpc = 299792.458 / 70; // c/H0 in Mpc
            const d_comoving_Mpc = c_Hubble_Mpc * 2 * (1 - Math.pow(1 + v.z, -0.5));
            const d_comoving_Gly = d_comoving_Mpc * 3.262e-3;
            return { a, t_age_Gyr, t_LB_Gyr, d_comoving_Mpc, d_comoving_Gly };
          }}
          outputs={[
            { key: 'a', label: 'Scale factor a = 1/(1+z)', unit: '' },
            { key: 't_age_Gyr', label: 'Age of universe at that z', unit: 'Gyr' },
            { key: 't_LB_Gyr', label: 'Lookback time (today − then)', unit: 'Gyr' },
            { key: 'd_comoving_Mpc', label: 'Comoving distance (approx)', unit: 'Mpc' },
            { key: 'd_comoving_Gly', label: 'Comoving distance', unit: 'Gly' },
          ]}
        />

        <Quiz questions={[
          { q: 'The cosmic microwave background was released when the universe became:',
            options: ['Hot enough to ionise hydrogen', 'Cool enough for electrons to combine with nuclei', 'Dense enough for the first stars to form', 'Filled with dark energy'],
            correct: 1,
            explain: 'At ~380,000 years after the Big Bang, the universe cooled to ~3,000 K — cool enough for electrons to combine with protons and helium nuclei. Before recombination, photons scattered constantly off free electrons (opaque universe). After: photons free-stream and reach us today as the CMB, redshifted to 2.725 K.' },
          { q: 'Big Bang nucleosynthesis (BBN) produced roughly:',
            options: ['100% hydrogen', '75% H, 25% He by mass, traces of D and Li', '50% H, 50% He', '90% H, 10% heavier elements'],
            correct: 1,
            explain: 'BBN, in the first ~20 minutes, produced ~75% ¹H, ~25% ⁴He, ~10⁻⁵ each of D and ³He, ~10⁻¹⁰ ⁷Li. Essentially no heavier elements. All the carbon, oxygen, iron etc. in your body was made in stars later, over billions of years.' },
          { q: 'Inflation is a hypothesised early period of:',
            options: ['Rapid cooling', 'Exponential expansion of space itself', 'Particle annihilation', 'Star formation'],
            correct: 1,
            explain: 'Inflation proposes that between ~10⁻³⁶ and ~10⁻³² seconds after t=0, space itself expanded by a factor of ~10²⁶ in an exponential burst. This solves three big puzzles: why the universe is so flat, why distant regions have nearly the same temperature, and where the structure-seeding density perturbations came from (quantum fluctuations stretched by inflation).' },
        ]} />

        <OpenQuestions items={[
          { q: 'What drove inflation, and is the theory testable?',
            detail: '— The "inflaton" particle/field is purely hypothetical. We have no direct evidence for it; inflation\'s predictions (flat universe, near-scale-invariant perturbations, gaussianity) are confirmed but generic. Detection of primordial gravitational waves from inflation (a "B-mode" CMB polarisation signal at scales ~1°) would be transformative — currently undetected despite intense effort.' },
          { q: 'Why is there matter rather than equal matter and antimatter?',
            detail: '— Standard physics predicts equal amounts. Observation: matter outnumbers antimatter by ~10⁹:1. The Sakharov conditions show what kind of physics would produce an asymmetry (CP violation + departure from thermal equilibrium + baryon number violation), but no concrete mechanism has been demonstrated experimentally. Active research at LHC and on neutrino oscillations.' },
          { q: 'Are the predicted abundances of ⁷Li and observed actually compatible?',
            detail: '— BBN predicts ⁷Li/H ≈ 5 × 10⁻¹⁰, but observations of metal-poor halo stars give 1.5 × 10⁻¹⁰ — a factor of ~3 discrepancy known as the "lithium problem". Either BBN is wrong, observed stars deplete lithium, or there\'s new physics. Despite many candidate explanations, none is widely accepted.' },
          { q: 'How big is the universe beyond what we can see?',
            detail: '— The observable universe is ~93 Gly in diameter (limited by the age of the universe and finite c). What lies beyond is unknown: inflation predicts a much larger "total" universe (maybe ~10²³ × the observable patch in linear scale), possibly infinite. We have no direct way to confirm this.' },
        ]} />
      </div>
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  10 · EXOPLANET DETECTION
// ═══════════════════════════════════════════════════════════════════════════
const METHODS = [
  { id: 'rv', name: 'Radial velocity', tag: 'Doppler wobble',
    sensitive: 'Massive planets close to their star',
    first: '51 Pegasi b · Mayor & Queloz 1995 · 2019 Nobel',
    count: '~1,100 confirmed' },
  { id: 'tr', name: 'Transit', tag: 'Photometric dip',
    sensitive: 'Edge-on orbits; favours short periods',
    first: 'HD 209458 b · 1999',
    count: '~4,400 confirmed (Kepler + TESS)' },
  { id: 'di', name: 'Direct imaging', tag: 'Photon by photon',
    sensitive: 'Young, hot, wide-orbit giant planets',
    first: '2M1207 b · 2004',
    count: '~80 confirmed' },
  { id: 'ml', name: 'Microlensing', tag: 'GR light-bending',
    sensitive: 'All distances, even free-floating planets',
    first: 'OGLE-2003-BLG-235L b · 2004',
    count: '~250 confirmed' },
];

function ExoplanetDetection({ onBack }) {
  const [m, setM] = useState('rv');
  const [phase, setPhase] = useState(0); // for animation (0-1)

  // Simple animation loop
  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 0.02) % 1), 50);
    return () => clearInterval(id);
  }, []);

  // ── Method-specific diagrams ──
  const W = 900, H = 360;

  const RVDiagram = () => {
    const cx = W / 2, cy = H / 2;
    const a = 80; // orbit radius
    const ang = phase * 2 * Math.PI;
    const px = cx + a * Math.cos(ang);
    const py = cy + a * Math.sin(ang) * 0.35;
    // Star wobbles opposite, smaller amplitude (mass ratio ~10⁻³)
    const swx = cx - 25 * Math.cos(ang);
    const swy = cy - 25 * Math.sin(ang) * 0.35;
    // RV signal: line-of-sight is x-axis; vy gives signal
    const vy = -Math.sin(ang); // -1 to 1 normalised
    // Mini light-curve sample positions
    const lc = Array.from({ length: 60 }, (_, i) => {
      const t = i / 60;
      return -Math.sin(t * 2 * Math.PI);
    });
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Orbit */}
        <ellipse cx={cx} cy={cy} rx={a} ry={a * 0.35} fill="none" stroke={BORDER_STRONG} strokeDasharray="3 4" />
        {/* Star (with wobble) */}
        <circle cx={swx} cy={swy} r="22" fill="#fff4ea" />
        <circle cx={swx} cy={swy} r="28" fill="#fff4ea" opacity="0.15" />
        {/* Star wobble path */}
        <ellipse cx={cx} cy={cy} rx="25" ry="9" fill="none" stroke={ACCENT} strokeDasharray="2 3" opacity="0.5" />
        {/* Planet */}
        <circle cx={px} cy={py} r="7" fill="#4d8edc" />
        {/* Doppler/spectrum indicator */}
        <g transform={`translate(${W - 240}, 30)`}>
          <text x="0" y="0" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>Spectrum shift</text>
          <rect x="0" y="10" width="200" height="20" fill="url(#spec-grad)" opacity="0.6" />
          <defs>
            <linearGradient id="spec-grad">
              <stop offset="0%" stopColor="#3361cc" />
              <stop offset="50%" stopColor="#fff" />
              <stop offset="100%" stopColor="#b03030" />
            </linearGradient>
          </defs>
          <line x1={100 + vy * 80} x2={100 + vy * 80} y1="6" y2="34" stroke={INK} strokeWidth="2" />
          <text x="0" y="48" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>blueshift</text>
          <text x="200" y="48" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>redshift</text>
        </g>
        {/* Mini RV curve */}
        <g transform={`translate(40, ${H - 80})`}>
          <text x="0" y="-6" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>Radial velocity (m/s)</text>
          <line x1="0" x2="180" y1="25" y2="25" stroke={BORDER} />
          <polyline fill="none" stroke={ACCENT} strokeWidth="1.5"
                    points={lc.map((v, i) => `${i * 3},${25 - v * 20}`).join(' ')} />
          <circle cx={(phase * 60) * 3} cy={25 - vy * 20} r="3" fill={ACCENT} />
        </g>
        <text x={cx} y={H - 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
          Star wobbles around system barycentre; spectral lines Doppler-shift periodically
        </text>
      </svg>
    );
  };

  const TransitDiagram = () => {
    const cx = W / 2, cy = H / 2 - 20;
    const starR = 50;
    // Planet moves left to right
    const px = 200 + phase * 500;
    const inTransit = px > cx - starR && px < cx + starR && Math.abs(0) < starR;
    // Flux: 1 if not in transit, 1 - (Rp/R*)^2 if in transit (with limb darkening edges)
    // Simulate flux curve over the cycle
    function flux(p) {
      const x = 200 + p * 500;
      const d = Math.abs(x - cx);
      if (d > starR + 10) return 1;
      if (d < starR - 10) return 0.985;
      // ingress/egress
      return 1 - 0.015 * (1 - (d - (starR - 10)) / 20);
    }
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Star */}
        <defs>
          <radialGradient id="star-trans">
            <stop offset="0%" stopColor="#fff8e0" />
            <stop offset="70%" stopColor="#ffd2a1" />
            <stop offset="100%" stopColor="#ff8a70" stopOpacity="0.3" />
          </radialGradient>
        </defs>
        <circle cx={cx} cy={cy} r={starR} fill="url(#star-trans)" />
        <circle cx={cx} cy={cy} r={starR + 8} fill="none" stroke="#ffd2a1" opacity="0.2" />
        {/* Planet (passes in front) */}
        <circle cx={px} cy={cy} r="8" fill="#0b0e17" stroke="#4d8edc" strokeWidth="1" />
        {/* Light curve */}
        <g transform={`translate(60, ${H - 110})`}>
          <text x="0" y="-6" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>Normalised flux (relative brightness)</text>
          <line x1="0" x2="780" y1="60" y2="60" stroke={BORDER} />
          <line x1="0" x2="0" y1="0" y2="60" stroke={BORDER} />
          <polyline fill="none" stroke={ACCENT} strokeWidth="1.5"
                    points={Array.from({ length: 80 }, (_, i) => `${i * 10},${20 + (1 - flux(i / 80)) * 1500}`).join(' ')} />
          <circle cx={phase * 800} cy={20 + (1 - flux(phase)) * 1500} r="3" fill={ACCENT} />
          <text x="-4" y="20" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>1.000</text>
          <text x="-4" y="44" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>0.985</text>
        </g>
        <text x={cx} y={H - 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
          Planet crosses the star's disk; brightness dips by (R_p / R_*)²
        </text>
      </svg>
    );
  };

  const DirectImagingDiagram = () => {
    const cx = W / 2, cy = H / 2;
    // Show a coronagraph blocking the star, with planets visible around it
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <radialGradient id="star-glow">
            <stop offset="0%" stopColor="#fff8e0" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#ffd2a1" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ff8a70" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Faint stellar halo */}
        <circle cx={cx} cy={cy} r="150" fill="url(#star-glow)" />
        {/* Coronagraph mask */}
        <circle cx={cx} cy={cy} r="40" fill="#0b0e17" />
        <circle cx={cx} cy={cy} r="40" fill="none" stroke={DIM} strokeDasharray="2 3" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
          coronagraph
        </text>
        {/* Planets (offsetting around) */}
        {[
          { a: 100, ph: 0, sz: 4, col: '#4d8edc', label: 'planet b' },
          { a: 140, ph: 0.3, sz: 3, col: '#7ac4ff', label: 'planet c' },
          { a: 180, ph: 0.7, sz: 3.5, col: '#aabfff', label: 'planet d' },
        ].map((pl, i) => {
          const ang = pl.ph * 2 * Math.PI + phase * 0.5;
          const x = cx + pl.a * Math.cos(ang);
          const y = cy + pl.a * Math.sin(ang) * 0.5;
          return (
            <g key={i}>
              <ellipse cx={cx} cy={cy} rx={pl.a} ry={pl.a * 0.5} fill="none" stroke={BORDER} strokeDasharray="2 4" />
              <circle cx={x} cy={y} r={pl.sz} fill={pl.col} />
              <text x={x + 8} y={y + 3} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={INK}>{pl.label}</text>
            </g>
          );
        })}
        <text x={cx} y={H - 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
          Block the star, image the planets. Like spotting a firefly next to a lighthouse.
        </text>
      </svg>
    );
  };

  const MicrolensingDiagram = () => {
    const cx = W / 2, cy = H / 2 - 20;
    // Foreground lens moves across, magnifying the source
    const lensX = 200 + phase * 500;
    // Magnification: simple peak shape with planet spike
    function mag(p) {
      const u = Math.abs(p - 0.5) * 4; // separation from peak
      const base = 1 + 1 / Math.sqrt(u * u + 0.1);
      // planetary spike
      const spike = Math.exp(-Math.pow((p - 0.42) * 50, 2)) * 1.5;
      return base + spike;
    }
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Background source star */}
        <text x={50} y={50} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>background star</text>
        <circle cx={80} cy={cy} r="6" fill="#fff4ea" />
        <circle cx={80} cy={cy} r="14" fill="#fff4ea" opacity="0.15" />

        {/* Lens (foreground star + planet) */}
        <circle cx={lensX} cy={cy} r="5" fill="#ffd2a1" />
        <circle cx={lensX + 15} cy={cy - 5} r="2" fill="#4d8edc" />
        <line x1={lensX} x2={lensX + 15} y1={cy} y2={cy - 5} stroke={DIM} strokeWidth="0.5" />

        {/* Bent light rays (schematic) */}
        <g opacity="0.5">
          <path d={`M 80 ${cy} Q ${lensX} ${cy - 30}, ${W - 60} ${cy}`} stroke={ACCENT} strokeWidth="0.5" fill="none" />
          <path d={`M 80 ${cy} Q ${lensX} ${cy + 30}, ${W - 60} ${cy}`} stroke={ACCENT} strokeWidth="0.5" fill="none" />
        </g>
        <text x={W - 80} y={50} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM} textAnchor="end">observer →</text>

        {/* Magnification curve */}
        <g transform={`translate(60, ${H - 130})`}>
          <text x="0" y="-6" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>Apparent magnification</text>
          <line x1="0" x2="780" y1="80" y2="80" stroke={BORDER} />
          <polyline fill="none" stroke={ACCENT} strokeWidth="1.5"
                    points={Array.from({ length: 80 }, (_, i) => `${i * 10},${80 - (mag(i / 80) - 1) * 18}`).join(' ')} />
          <circle cx={phase * 800} cy={80 - (mag(phase) - 1) * 18} r="3" fill={ACCENT} />
          <text x="780" y="40" textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={ACCENT}>planet spike →</text>
        </g>
        <text x={cx} y={H - 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
          Foreground star + planet bend light from a more distant star; a brief sharp spike betrays the planet
        </text>
      </svg>
    );
  };

  const diagrams = { rv: <RVDiagram />, tr: <TransitDiagram />, di: <DirectImagingDiagram />, ml: <MicrolensingDiagram /> };
  const cur = METHODS.find(x => x.id === m);

  // Mass–distance plot positions for sensitivity overlay
  const SW = 600, SH = 380;
  const SPL = 60, SPR = 580, SPT = 30, SPB = 340;
  const logA_min = -2, logA_max = 3; // AU
  const logM_min = -1, logM_max = 4; // Earth masses
  const xA = la => SPL + (SPR - SPL) * (la - logA_min) / (logA_max - logA_min);
  const yM = lm => SPB - (SPB - SPT) * (lm - logM_min) / (logM_max - logM_min);

  return (
    <PageShell onBack={onBack} eyebrow="11 — Exoplanetary Science"
               title={<>Detecting <em style={{ color: ACCENT, fontStyle: 'italic' }}>Other Worlds</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Until 1992, the only known planets orbited the Sun. We now know of more than 5,800 exoplanets in
        ~4,300 systems, found through five very different physical techniques. Each method works in a
        different region of mass–distance space — together they sketch the diversity of planetary systems.
      </p>

      {/* Method picker */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-6" style={{ background: BORDER }}>
        {METHODS.map(method => (
          <button key={method.id} onClick={() => setM(method.id)}
                  className="p-4 text-left transition"
                  style={{ background: m === method.id ? `${ACCENT}15` : BG,
                           borderTop: m === method.id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-lg mb-1" style={{ color: m === method.id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{method.name}</div>
            <div className="font-mono text-[10px]" style={{ color: DIM }}>{method.tag}</div>
          </button>
        ))}
      </div>

      <div className="fade-in" key={m}>
        <div className="relative mb-6" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
          {diagrams[m]}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-10" style={{ background: BORDER }}>
          <div className="p-4" style={{ background: BG }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Sensitive to</div>
            <div className="font-display text-base" style={{ color: INK }}>{cur.sensitive}</div>
          </div>
          <div className="p-4" style={{ background: BG }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>First detection</div>
            <div className="font-display text-base" style={{ color: INK }}>{cur.first}</div>
          </div>
          <div className="p-4" style={{ background: BG }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Planets found</div>
            <div className="font-display text-base" style={{ color: INK }}>{cur.count}</div>
          </div>
        </div>
      </div>

      {/* Mass-distance sensitivity plot */}
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em]" style={{ color: ACCENT }}>
        Where each method works (mass × semi-major axis)
      </div>
      <div className="relative" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
        <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full h-auto">
          {/* Grid */}
          {[-2, -1, 0, 1, 2, 3].map(la => (
            <g key={la}>
              <line x1={xA(la)} x2={xA(la)} y1={SPT} y2={SPB} stroke={BORDER} strokeWidth="0.5" />
              <text x={xA(la)} y={SPB + 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>
                10{la === 0 ? '⁰' : la < 0 ? '⁻' + Math.abs(la) : la}
              </text>
            </g>
          ))}
          {[-1, 0, 1, 2, 3, 4].map(lm => (
            <g key={lm}>
              <line x1={SPL} x2={SPR} y1={yM(lm)} y2={yM(lm)} stroke={BORDER} strokeWidth="0.5" />
              <text x={SPL - 8} y={yM(lm) + 4} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={DIM}>
                10{lm === 0 ? '⁰' : lm < 0 ? '⁻' + Math.abs(lm) : lm}
              </text>
            </g>
          ))}
          <text x={(SPL + SPR) / 2} y={SH - 5} textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                fontSize="10" fill={INK} letterSpacing="0.15em">SEMI-MAJOR AXIS (AU)</text>
          <text x={SPL - 45} y={(SPT + SPB) / 2} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}
                transform={`rotate(-90, ${SPL - 45}, ${(SPT + SPB) / 2})`} letterSpacing="0.15em">
            MASS (M⊕)
          </text>
          {/* Method regions */}
          {/* RV: massive planets, broad range of distances */}
          <ellipse cx={xA(0)} cy={yM(2.7)} rx={(xA(2)-xA(-1.5))/2} ry={(yM(0.5)-yM(3.8))/2} fill={ACCENT} opacity={m==='rv' ? 0.18 : 0.05} stroke={ACCENT} strokeWidth="1" />
          <text x={xA(0)} y={yM(3.5)} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT}>radial velocity</text>
          {/* Transit: close-in (geometric prob), wide mass range */}
          <ellipse cx={xA(-0.7)} cy={yM(1.5)} rx={(xA(0.5)-xA(-1.8))/2} ry={(yM(-0.2)-yM(3.3))/2} fill={ACCENT2} opacity={m==='tr' ? 0.18 : 0.05} stroke={ACCENT2} strokeWidth="1" />
          <text x={xA(-0.7)} y={yM(2.3)} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT2}>transits</text>
          {/* Direct imaging: wide, massive */}
          <ellipse cx={xA(2)} cy={yM(3.3)} rx={(xA(2.8)-xA(1.2))/2} ry={(yM(2.5)-yM(4))/2} fill="#ff8a70" opacity={m==='di' ? 0.18 : 0.05} stroke="#ff8a70" strokeWidth="1" />
          <text x={xA(2)} y={yM(3.8)} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#ff8a70">direct imaging</text>
          {/* Microlensing: mid distances, broad mass */}
          <ellipse cx={xA(0.6)} cy={yM(1.8)} rx={(xA(1.5)-xA(-0.3))/2} ry={(yM(0)-yM(3.5))/2} fill="#aabfff" opacity={m==='ml' ? 0.18 : 0.05} stroke="#aabfff" strokeWidth="1" />
          <text x={xA(0.6)} y={yM(0.5)} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#aabfff">microlensing</text>
          {/* Solar system planets for reference */}
          {[
            { name: 'Mercury', a: 0.39, m: 0.055 }, { name: 'Venus', a: 0.72, m: 0.815 },
            { name: 'Earth', a: 1, m: 1 }, { name: 'Mars', a: 1.52, m: 0.107 },
            { name: 'Jupiter', a: 5.2, m: 317.8 }, { name: 'Saturn', a: 9.5, m: 95.2 },
            { name: 'Uranus', a: 19.2, m: 14.5 }, { name: 'Neptune', a: 30, m: 17.1 },
          ].map(p => (
            <g key={p.name}>
              <circle cx={xA(Math.log10(p.a))} cy={yM(Math.log10(p.m))} r="3" fill={INK} />
              <text x={xA(Math.log10(p.a)) + 5} y={yM(Math.log10(p.m)) + 3} fontFamily="JetBrains Mono, monospace" fontSize="8" fill={INK}>{p.name[0]}</text>
            </g>
          ))}
        </svg>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] mt-3" style={{ color: DIM }}>
        Dots = our solar system. Each shaded region shows roughly where one method is most productive.
      </p>

      <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
        <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>The physics, method by method</h3>

        <Section title="Radial velocity: hearing the wobble">
          <p>
            A star and planet orbit their common centre of mass. The star’s line-of-sight velocity oscillates
            periodically. We measure that velocity from the Doppler shift of spectral lines: redshift when
            the star recedes, blueshift when it approaches.
          </p>
          <Eq>
            K = (2πG / P)<sup>1/3</sup> × M<sub>p</sub> sin i / (M<sub>★</sub> + M<sub>p</sub>)<sup>2/3</sup> × (1 − e²)<sup>−1/2</sup>
          </Eq>
          <p>
            K is the radial-velocity semi-amplitude; P the orbital period; i the orbital inclination; e the
            eccentricity. Jupiter induces a 12.5 m/s wobble in the Sun over 12 years. Earth induces just
            9 cm/s. State-of-the-art spectrographs (ESPRESSO, EXPRES) reach ~10 cm/s — Earth-mass detection
            around Sun-like stars is now barely possible. The major obstacle is no longer instrumental: it’s
            <em> stellar jitter</em> from starspots, granulation, and oscillations, which mimics or buries
            planetary signals.
          </p>
          <p>
            Critically, RV only gives M sin i — the projected mass. Without knowing inclination i, you only
            have a lower mass limit. Transit detections of the same planet pin down i ≈ 90°, removing the
            ambiguity.
          </p>
        </Section>

        <Section title="Transits: shadowing the star">
          <p>
            When a planet’s orbit happens to be edge-on, it passes in front of its star and the brightness
            dips. The fractional depth is:
          </p>
          <Eq>ΔF / F = (R<sub>p</sub> / R<sub>★</sub>)²</Eq>
          <p>
            For a Jupiter (R<sub>p</sub> = 0.10 R☉) transiting a Sun (R<sub>★</sub> = 1 R☉), the dip is ~1%.
            For an Earth, it’s ~84 parts per million — a 0.008% dip. Detecting that requires extraordinary
            photometric stability, which is why Kepler had to be a dedicated space telescope.
          </p>
          <p>
            Transits give us R<sub>p</sub> directly. Combined with an RV mass, this gives the planet’s mean
            density — and hence whether it’s rocky, gaseous, or icy. They also enable <em>transmission spectroscopy</em>:
            during transit, ~10⁻⁴ of the starlight passes through the planet’s atmosphere, imprinting
            molecular features that can be detected from above-atmosphere instruments. JWST has now detected
            CO₂, H₂O, SO₂, CH₄, and even early hints of biosignatures in a few exoplanet atmospheres.
          </p>
          <p>
            The geometric transit probability is just R<sub>★</sub>/a — about 0.5% for an Earth-like orbit
            around a Sun. So for every detected transiting planet at 1 AU, ~200 systems have one we’d miss.
            Statistical corrections of this kind are why <em>occurrence rate</em> calculations (e.g. how many
            Earth-like planets per Sun-like star: ~0.1–0.5, with large uncertainties) are subtle.
          </p>
        </Section>

        <Section title="Direct imaging: photons from the planet itself">
          <p>
            The conceptually simplest method — actually photograph the planet — is the technically hardest.
            A star outshines its planet by factors of 10⁹ (visible light, reflected) to 10⁶ (infrared, thermal
            from a young giant). Standing at ten metres, you’d be trying to see a candle next to a lighthouse.
          </p>
          <p>
            Coronagraphs block the direct stellar light; adaptive optics correct atmospheric turbulence;
            “angular differential imaging” uses the sky’s rotation to distinguish real planets from instrumental
            artefacts. Only a few dozen planets have been directly imaged so far — almost all young (~10–100 Myr)
            giant planets in wide orbits (10–1000 AU), still glowing from their initial heat of formation.
          </p>
          <p>
            The future of direct imaging is high-contrast space coronagraphs (Roman, HWO) and starshade
            missions, aiming for the 10¹⁰ contrast needed to image an Earth around a nearby Sun-like star.
          </p>
        </Section>

        <Section title="Microlensing: general relativity as a detector">
          <p>
            When a foreground star passes nearly in front of a more distant background star, its gravity
            acts as a lens, magnifying the background star’s light. A planet orbiting the lens star produces
            a brief, sharp deviation in the magnification curve — a spike lasting hours to days.
          </p>
          <Eq>
            Einstein radius:  θ<sub>E</sub> = √(4GM / c² × (D<sub>s</sub> − D<sub>l</sub>) / (D<sub>s</sub> D<sub>l</sub>))
          </Eq>
          <p>
            Microlensing is sensitive to planets at distances of ~kpc — across the Milky Way — and can detect
            even <em>free-floating planets</em> not bound to any star. The disadvantage: each event happens
            once, with no follow-up. The planet is gone after the lensing geometry passes. Surveys like OGLE,
            MOA, and KMTNet stream tens of millions of bulge stars every clear night. Roman will be the
            game-changer.
          </p>
        </Section>

        <Section title="The Kepler revolution and what it taught us">
          <p>
            NASA’s Kepler mission (2009–2018) stared at one patch of sky for four years, photometering
            150,000 stars to ~10 ppm precision. It found ~2,700 confirmed planets and showed that planets
            are <em>everywhere</em>: on average, every star in the galaxy has at least one planet, and
            small planets (1–2 R⊕) are more common than big ones.
          </p>
          <p>
            Other Kepler revelations: hot Jupiters are rare (~1% of stars); super-Earths / sub-Neptunes
            (1–4 R⊕) are the most common type of planet in the galaxy, and they don’t exist in our solar
            system; there’s a sharp “radius valley” at ~1.8 R⊕ caused by atmospheric mass loss from XUV
            irradiation. TESS (2018–) is now doing the same kind of survey but for nearby bright stars
            suitable for atmospheric follow-up.
          </p>
        </Section>

        <Section title="The habitable zone">
          <p>
            The classical habitable zone is the orbital range in which liquid water could exist on a
            rocky planet’s surface. Inner edge: where water vapour escapes (runaway greenhouse, Venus
            today). Outer edge: where CO₂ condenses out and the carbonate–silicate cycle can’t maintain
            warmth (Mars today).
          </p>
          <Eq>
            Boundaries scale as a<sub>HZ</sub> ≈ √(L / L☉) AU
          </Eq>
          <p>
            For the Sun, the conservative HZ is ~0.95 to ~1.67 AU. For an M dwarf with L = 10⁻³ L☉, the HZ
            sits at 0.03–0.05 AU — very close in. Planets there are subject to intense stellar flaring,
            extreme XUV, and tidal locking — open questions on habitability that are now driving JWST
            atmospheric characterisation of M-dwarf rocky planets (TRAPPIST-1, LHS 1140 b, etc).
          </p>
          <p>
            A liquid-water surface is also probably not the only path to habitability. Europa, Enceladus,
            and Titan have subsurface oceans far outside any classical HZ. The same may apply to many
            exoplanets — vastly expanding the potentially habitable population if true.
          </p>
        </Section>

        <Playground
          title="Habitable zone calculator"
          description="The habitable zone scales with the square root of stellar luminosity (Stefan-Boltzmann + inverse-square law). A low-luminosity M dwarf has its HZ tucked very close in; a luminous F star has a wide HZ far out."
          inputs={[
            { key: 'L', label: 'Stellar luminosity', default: 1, min: -4, max: 2, log: true, unit: 'L☉' },
            { key: 'M', label: 'Stellar mass', default: 1, min: -1, max: 1.3, log: true, unit: 'M☉' },
          ]}
          compute={(v) => {
            // Conservative HZ boundaries (Kopparapu et al)
            const HZ_inner_AU = 0.95 * Math.sqrt(v.L);
            const HZ_outer_AU = 1.67 * Math.sqrt(v.L);
            // Orbital period at center of HZ (Kepler's third law)
            const a_center = (HZ_inner_AU + HZ_outer_AU) / 2;
            const P_yr = Math.sqrt(Math.pow(a_center, 3) / v.M);
            const P_days = P_yr * 365.25;
            const T_eq_K = 255 * Math.pow(v.L / Math.pow(a_center, 2), 0.25);
            return { HZ_inner_AU, HZ_outer_AU, a_center, P_yr, P_days, T_eq_K };
          }}
          outputs={[
            { key: 'HZ_inner_AU', label: 'Inner HZ edge (runaway greenhouse)', unit: 'AU' },
            { key: 'HZ_outer_AU', label: 'Outer HZ edge (max CO₂ greenhouse)', unit: 'AU' },
            { key: 'P_days', label: 'Orbital period at HZ centre', unit: 'days' },
            { key: 'P_yr', label: 'In years', unit: 'yr' },
            { key: 'T_eq_K', label: 'Equilibrium T (no atmosphere)', unit: 'K' },
          ]}
        />

        <WorkedExample title="Detecting Jupiter from a hypothetical alien observer"
                       steps={[
                         { text: 'Imagine an alien astronomer 30 light-years away watching the Sun. Could they detect Jupiter via the radial velocity (Doppler wobble) method?',
                           eq: 'v_★ = v_planet × (m_planet / m_star)' },
                         { text: 'Jupiter orbits at v_planet ≈ 13 km/s. m_Jupiter / m_Sun ≈ 9.5 × 10⁻⁴. So the Sun\'s reflex motion is:',
                           eq: 'v_Sun = 13 km/s × 9.5 × 10⁻⁴ ≈ 12.4 m/s' },
                         { text: 'Compare to instrumental precision: the best current spectrographs (ESPRESSO, EXPRES) reach ~0.5–1 m/s. So Jupiter would be detectable — but barely.',
                           answer: 'Yes — but only just. The 12 m/s signal is real but lies near the precision floor. They\'d need ~12 years of continuous observation to see the full ~12-year orbital cycle. Their first hint would come around year 6, with a full confirmation by year 12. Earth, by contrast, induces only ~9 cm/s — completely below current detection capability for any star except the Sun itself.' },
                       ]} />

        <Quiz questions={[
          { q: 'Why does the transit method have a strong bias toward short-period planets?',
            options: ['Short-period planets are larger', 'A planet must be in transit when we look, which is more likely if its period is short', 'Stars near us tend to have short-period planets', 'Long-period planets don\'t transit'],
            correct: 1,
            explain: 'Transit probability ∝ R★/a. For Earth at 1 AU around the Sun, transit probability is ~0.5%. For a hot Jupiter at 0.05 AU, ~10%. And we need to catch a transit during our observation window — a planet with a 100-day period transits more often per observation campaign than one with a 10-year period. Both effects favour short orbits.' },
          { q: 'A planet 1 R_Earth in size transits a Sun-like star. The transit depth (flux dip) is approximately:',
            options: ['~0.01%', '~1%', '~10%', '~50%'],
            correct: 0,
            explain: 'Transit depth = (R_planet/R_star)². For Earth/Sun: (1/109)² ≈ 8 × 10⁻⁵ ≈ 0.008%. This is at the very edge of Kepler/TESS sensitivity. By contrast a Jupiter (11 R_Earth) gives a ~1% dip — comfortably detectable from the ground.' },
          { q: 'The first confirmed exoplanet around a Sun-like star (51 Peg b, 1995) was a:',
            options: ['Rocky planet in the habitable zone', 'Hot Jupiter — a gas giant orbiting in 4 days', 'Cold gas giant similar to Jupiter', 'Planet around a pulsar'],
            correct: 1,
            explain: '51 Pegasi b stunned everyone — a Jupiter-mass planet orbiting in 4.2 days, far closer to its star than Mercury is to the Sun. Theory at the time said this was impossible. The discovery overturned planetary formation theory and led to the now-standard idea of "planetary migration".' },
        ]} />

        <TryThis title="Engage with real exoplanet data"
                 items={[
                   { title: 'Browse NASA\'s Exoplanet Archive', text: 'Go to exoplanetarchive.ipac.caltech.edu and look at the confirmed planets table. Sort by discovery year. Note how the typical detected planet has changed over 30 years — from hot Jupiters in the 1990s to potentially habitable terrestrial planets today.', gear: 'Browser' },
                   { title: 'Watch a Kepler light curve', text: 'On the same site, pull up Kepler-186f (the first Earth-sized HZ planet around an M dwarf). Plot its phase-folded light curve. You\'ll see a clear flat-bottomed transit dip — the actual signal that announced a potentially habitable world.', gear: 'Browser, basic Python or just the site\'s plot tool' },
                   { title: 'Imagine the SETI scale', text: 'There are ~4 × 10⁹ stars within 10,000 light-years of Earth. If even 1% host an Earth-like planet in the HZ (a conservative Kepler estimate), that\'s 40 million potentially habitable worlds within radio-communication range. The question "are we alone" is increasingly an empirical one.', gear: 'Imagination + the exoplanet stats' },
                 ]} />

        <OpenQuestions items={[
          { q: 'What fraction of stars host habitable-zone Earth-like planets?',
            detail: '— Kepler\'s statistics suggest the "eta-Earth" frequency for Sun-like stars is somewhere between 10% and 50%. The uncertainty is large because Earth-sized HZ planets are at the limit of Kepler\'s sensitivity. Future missions (Roman Space Telescope, ELT, LUVOIR-like concepts) are designed to nail this down.' },
          { q: 'Are M-dwarf HZ planets actually habitable?',
            detail: '— M dwarfs are the most common stars and easiest to find planets around. But their habitable zones are tucked close in, exposing planets to intense flares and tidal locking. TRAPPIST-1, Proxima Cen b, and others are nearby HZ candidates — JWST is starting to characterise their atmospheres, with sobering early results (TRAPPIST-1 b appears bare-rock).' },
          { q: 'What atmospheric biosignatures would convince us a planet is inhabited?',
            detail: '— O₂ + CH₄ together (out of chemical equilibrium) would be a strong sign. But abiotic processes (photolysis of water, hydrogen escape) can also produce O₂. False positives are a real concern. The question of "what\'s a definitive biosignature" remains unsettled even for future missions.' },
        ]} />
      </div>
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  11 · THE MOON · PHASES, TIDES, AND LUNAR SCIENCE
// ═══════════════════════════════════════════════════════════════════════════

const MOON_PHASES = [
  { id: 'new',  ang: 0,    name: 'New Moon',         illum: 0,    rise: 'sunrise',  set: 'sunset',  visible: 'invisible (with the Sun)' },
  { id: 'wc1',  ang: 45,   name: 'Waxing Crescent',  illum: 0.25, rise: '~9 am',    set: '~9 pm',   visible: 'afternoon & evening west' },
  { id: 'fq',   ang: 90,   name: 'First Quarter',    illum: 0.5,  rise: 'noon',     set: 'midnight',visible: 'afternoon & evening' },
  { id: 'wg1',  ang: 135,  name: 'Waxing Gibbous',   illum: 0.75, rise: '~3 pm',    set: '~3 am',   visible: 'evening & most of night' },
  { id: 'full', ang: 180,  name: 'Full Moon',        illum: 1,    rise: 'sunset',   set: 'sunrise', visible: 'all night' },
  { id: 'wg2',  ang: 225,  name: 'Waning Gibbous',   illum: 0.75, rise: '~9 pm',    set: '~9 am',   visible: 'late evening & morning' },
  { id: 'lq',   ang: 270,  name: 'Last Quarter',     illum: 0.5,  rise: 'midnight', set: 'noon',    visible: 'late night & morning' },
  { id: 'wc2',  ang: 315,  name: 'Waning Crescent',  illum: 0.25, rise: '~3 am',    set: '~3 pm',   visible: 'pre-dawn east' },
];

/** Render a moon at a given phase angle. ang = 0 (new) to 360 (back to new), with 180 = full. */
function MoonGlyph({ ang, size = 100 }) {
  const r = size / 2 - 2;
  const cx = size / 2, cy = size / 2;
  // Convert phase angle to terminator position
  // ang 0 = new (0% lit), 90 = first qtr (right half lit), 180 = full, 270 = last qtr (left half lit)
  const phaseRad = (ang * Math.PI) / 180;
  // cos(phase) gives the projected terminator x-position relative to centre
  // At new (ang=0): cos = 1, terminator at +r (no light visible)
  // At first qtr (ang=90): cos = 0, terminator at centre (right lit)
  // At full (ang=180): cos = -1, terminator at -r (fully lit)
  // At last qtr (ang=270): cos = 0, terminator at centre (left lit)
  const k = Math.cos(phaseRad); // -1 to 1
  // Which side is lit?
  const litOnRight = ang < 180;

  // Build a clip path for the lit portion using two ellipse arcs
  // Outer disk circle + terminator ellipse forms a crescent or gibbous
  const ellipseRx = Math.abs(k) * r;
  const sweepOuter = litOnRight ? 1 : 0;
  const sweepInner = (k >= 0) === litOnRight ? 0 : 1;

  // Lit region path: top of disk → bottom along outer circle → back up along terminator
  const litPath = `
    M ${cx} ${cy - r}
    A ${r} ${r} 0 0 ${sweepOuter} ${cx} ${cy + r}
    A ${ellipseRx} ${r} 0 0 ${sweepInner} ${cx} ${cy - r}
    Z
  `;

  const gradId = `moon-grad-${ang}-${size}`;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <defs>
        <radialGradient id={gradId} cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fdf6e3" />
          <stop offset="70%" stopColor="#e8dcc0" />
          <stop offset="100%" stopColor="#9a8e72" />
        </radialGradient>
      </defs>
      {/* Dark side of the moon (shown faintly so the disc is always visible) */}
      <circle cx={cx} cy={cy} r={r} fill="#1a1d28" stroke={BORDER_STRONG} strokeWidth="0.5" />
      {/* Lit portion */}
      <path d={litPath} fill={`url(#${gradId})`} />
      {/* Maria suggestion - subtle */}
      <circle cx={cx - r * 0.2} cy={cy - r * 0.2} r={r * 0.12} fill="#000" opacity="0.08" />
      <circle cx={cx + r * 0.15} cy={cy + r * 0.25} r={r * 0.18} fill="#000" opacity="0.08" />
      <circle cx={cx - r * 0.3} cy={cy + r * 0.1} r={r * 0.08} fill="#000" opacity="0.08" />
    </svg>
  );
}

function MoonTopic({ onBack }) {
  const [phaseIdx, setPhaseIdx] = useState(4); // start at full
  const [tab, setTab] = useState('phases'); // phases | tides | eclipses
  const phase = MOON_PHASES[phaseIdx];

  // For the phase explainer diagram: orbital geometry view
  // Show: Sun rays from the left, Earth at centre, Moon at orbital position
  const OrbitDiagram = ({ ang, W = 800, H = 360 }) => {
    const cx = W / 2 + 80, cy = H / 2;
    const orbitR = 130;
    // Phase angle: 0 = new (Moon between Earth and Sun, ang = 180° in our diagram from +x)
    // 180 = full (Moon opposite the Sun, ang = 0° from +x)
    // Convert phase angle to orbital angle (Sun on left, so new moon is at left of Earth)
    const orbAng = Math.PI - (ang * Math.PI) / 180; // radians
    const mx = cx + orbitR * Math.cos(orbAng);
    const my = cy + orbitR * Math.sin(orbAng);
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Sun rays from the left */}
        <defs>
          <linearGradient id="sun-rays" x1="0" x2="1">
            <stop offset="0%" stopColor="#ffc97a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffc97a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="200" height={H} fill="url(#sun-rays)" />
        {[H/2 - 80, H/2 - 40, H/2, H/2 + 40, H/2 + 80].map((y, i) => (
          <line key={i} x1="20" x2="180" y1={y} y2={y} stroke="#ffc97a" strokeWidth="1" opacity="0.5" />
        ))}
        <text x="100" y="30" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
              fontSize="10" fill={ACCENT} letterSpacing="0.15em">SUNLIGHT →</text>

        {/* Moon orbit */}
        <circle cx={cx} cy={cy} r={orbitR} fill="none" stroke={BORDER_STRONG} strokeDasharray="2 4" />

        {/* Phantom moons at the 8 phase positions */}
        {MOON_PHASES.map((p, i) => {
          const a = Math.PI - (p.ang * Math.PI) / 180;
          const x = cx + orbitR * Math.cos(a);
          const y = cy + orbitR * Math.sin(a);
          const isActive = i === phaseIdx;
          // The actual moon visualization (how it looks as half-lit by sunlight)
          return (
            <g key={p.id} onClick={() => setPhaseIdx(i)} style={{ cursor: 'pointer' }}>
              {isActive && <circle cx={x} cy={y} r="22" fill="none" stroke={ACCENT} strokeWidth="1" opacity="0.6" />}
              {/* Sun-lit half (always faces sun, i.e. left side) */}
              <circle cx={x} cy={y} r="12" fill="#1a1d28" stroke={BORDER_STRONG} strokeWidth="0.5" />
              <path d={`M ${x} ${y - 12} A 12 12 0 0 0 ${x} ${y + 12} Z`} fill="#fdf6e3" />
            </g>
          );
        })}

        {/* Earth */}
        <circle cx={cx} cy={cy} r="18" fill="#4d8edc" />
        <path d={`M ${cx} ${cy - 18} A 18 18 0 0 0 ${cx} ${cy + 18} Z`} fill="#1a1d28" opacity="0.5" />
        <text x={cx} y={cy + 38} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>Earth</text>

        {/* Active moon (highlighted) */}
        <circle cx={mx} cy={my} r="15" fill="none" stroke={ACCENT} strokeWidth="1.5" />

        {/* What the moon looks like from Earth - inset */}
        <g transform={`translate(${W - 130}, 30)`}>
          <text x="50" y="-6" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                fontSize="9" fill={DIM} letterSpacing="0.15em">SEEN FROM EARTH</text>
          <g transform="translate(0, 0)">
            <MoonGlyph ang={phase.ang} size={100} />
          </g>
          <text x="50" y="120" textAnchor="middle" fontFamily="JetBrains Mono, monospace"
                fontSize="10" fill={INK}>{phase.name}</text>
        </g>
      </svg>
    );
  };

  // Tide diagram
  const TideDiagram = ({ W = 800, H = 360 }) => {
    const cx = W / 2, cy = H / 2;
    const earthR = 50;
    // Two bulges - one toward moon (right), one opposite (left)
    // Exaggerated for visibility
    const bulgeAmount = 18;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <defs>
          <radialGradient id="ocean-grad">
            <stop offset="0%" stopColor="#4d8edc" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#4d8edc" stopOpacity="0.15" />
          </radialGradient>
        </defs>

        {/* Ocean bulges - elongated ellipse along Earth-Moon line */}
        <ellipse cx={cx} cy={cy} rx={earthR + bulgeAmount} ry={earthR - 5}
                 fill="url(#ocean-grad)" stroke={ACCENT2} strokeWidth="1" opacity="0.7" />

        {/* Earth */}
        <circle cx={cx} cy={cy} r={earthR} fill="#3a5a7a" />
        <circle cx={cx} cy={cy} r={earthR} fill="none" stroke={INK} opacity="0.3" />

        {/* Continent suggestion */}
        <path d={`M ${cx - 30} ${cy - 20} Q ${cx - 10} ${cy - 30}, ${cx + 5} ${cy - 15}
                  Q ${cx + 15} ${cy + 5}, ${cx - 5} ${cy + 20} Q ${cx - 30} ${cy + 15}, ${cx - 30} ${cy - 20} Z`}
              fill="#5a6a4a" opacity="0.7" />

        {/* High-tide labels */}
        <g>
          <line x1={cx + earthR + bulgeAmount + 4} x2={cx + earthR + bulgeAmount + 30}
                y1={cy} y2={cy - 30} stroke={ACCENT} strokeWidth="0.5" />
          <text x={cx + earthR + bulgeAmount + 32} y={cy - 32} fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT}>
            high tide (sub-lunar)
          </text>
        </g>
        <g>
          <line x1={cx - earthR - bulgeAmount - 4} x2={cx - earthR - bulgeAmount - 30}
                y1={cy} y2={cy - 30} stroke={ACCENT} strokeWidth="0.5" />
          <text x={cx - earthR - bulgeAmount - 32} y={cy - 32} textAnchor="end" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT}>
            high tide (anti-lunar)
          </text>
        </g>
        <text x={cx} y={cy - earthR - bulgeAmount - 8} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT2}>
          low tide
        </text>
        <text x={cx} y={cy + earthR + bulgeAmount + 18} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT2}>
          low tide
        </text>

        {/* Moon on the right */}
        <g transform={`translate(${W - 80}, ${cy})`}>
          <MoonGlyph ang={180} size={48} />
          <text x="24" y="40" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>Moon</text>
        </g>

        {/* Force arrows */}
        <g>
          {/* Arrow toward moon at sub-lunar point */}
          <line x1={cx + earthR + 4} x2={cx + earthR + 20} y1={cy} y2={cy} stroke={ACCENT3} strokeWidth="1.5" markerEnd="url(#arrow)" />
          {/* Arrow away from moon at anti-lunar */}
          <line x1={cx - earthR - 4} x2={cx - earthR - 20} y1={cy} y2={cy} stroke={ACCENT3} strokeWidth="1.5" markerEnd="url(#arrow)" />
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 Z" fill={ACCENT3} />
            </marker>
          </defs>
        </g>

        <text x={cx} y={H - 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
          Two bulges: near side feels more lunar gravity than Earth's centre; far side feels less.
        </text>
      </svg>
    );
  };

  // Eclipse diagram
  const EclipseDiagram = ({ kind, W = 800, H = 300 }) => {
    const sunX = 80, sunY = H / 2, sunR = 45;
    const earthX = W - 200, earthY = H / 2, earthR = 22;
    const moonR = 8;

    if (kind === 'solar') {
      // Moon between Sun and Earth
      const moonX = earthX - 110, moonY = earthY;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* Sun */}
          <defs>
            <radialGradient id="sun-grad-ec">
              <stop offset="0%" stopColor="#fff8e0" />
              <stop offset="70%" stopColor="#ffc97a" />
              <stop offset="100%" stopColor="#ff8a70" stopOpacity="0.4" />
            </radialGradient>
          </defs>
          <circle cx={sunX} cy={sunY} r={sunR} fill="url(#sun-grad-ec)" />
          <text x={sunX} y={sunY + sunR + 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>Sun</text>

          {/* Light rays / shadow cones (umbra + penumbra) */}
          {/* Umbra: tangent lines from inner (sun-moon) crossing */}
          {/* Schematic - just draw narrowing cone from Sun edges past Moon */}
          <g opacity="0.4">
            <polygon points={`${sunX},${sunY - sunR} ${moonX},${moonY - moonR} ${moonX},${moonY + moonR} ${sunX},${sunY + sunR}`}
                     fill="#ffc97a" opacity="0.1" />
          </g>
          {/* Umbra cone past moon */}
          <polygon points={`${moonX},${moonY - moonR} ${moonX + 130},${moonY - 2} ${moonX + 130},${moonY + 2} ${moonX},${moonY + moonR}`}
                   fill="#1a1d28" opacity="0.8" />
          <text x={moonX + 65} y={moonY - 14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="9" fill={ACCENT}>
            umbra
          </text>

          {/* Moon */}
          <circle cx={moonX} cy={moonY} r={moonR} fill="#1a1d28" stroke={DIM} strokeWidth="0.5" />
          <text x={moonX} y={moonY + moonR + 14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>Moon</text>

          {/* Earth */}
          <circle cx={earthX} cy={earthY} r={earthR} fill="#4d8edc" />
          <path d={`M ${earthX} ${earthY - earthR} A ${earthR} ${earthR} 0 0 1 ${earthX} ${earthY + earthR} Z`} fill="#1a1d28" opacity="0.5" />
          <text x={earthX} y={earthY + earthR + 14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>Earth</text>

          <text x={W/2} y={H - 12} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
            Solar eclipse: Moon's shadow falls on Earth. Only ~270 km wide path of totality.
          </text>
        </svg>
      );
    } else {
      // Lunar eclipse: Earth between Sun and Moon
      const moonX = W - 80, moonY = earthY;
      return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <defs>
            <radialGradient id="sun-grad-ec2">
              <stop offset="0%" stopColor="#fff8e0" />
              <stop offset="70%" stopColor="#ffc97a" />
              <stop offset="100%" stopColor="#ff8a70" stopOpacity="0.4" />
            </radialGradient>
          </defs>
          <circle cx={sunX} cy={sunY} r={sunR} fill="url(#sun-grad-ec2)" />
          <text x={sunX} y={sunY + sunR + 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>Sun</text>

          {/* Earth shadow extending past Earth */}
          <polygon points={`${earthX - 40},${earthY - earthR} ${earthX + 250},${earthY - 4} ${earthX + 250},${earthY + 4} ${earthX - 40},${earthY + earthR}`}
                   fill="#1a1d28" opacity="0.85" />
          <text x={earthX + 100} y={earthY - 14} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={ACCENT}>
            Earth's shadow (umbra)
          </text>

          {/* Earth */}
          <circle cx={earthX} cy={earthY} r={earthR} fill="#4d8edc" />
          <text x={earthX} y={earthY + earthR + 14} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>Earth</text>

          {/* Moon in shadow - reddish due to refracted sunlight */}
          <circle cx={moonX} cy={moonY} r={moonR + 2} fill="#cd5c3c" opacity="0.8" />
          <text x={moonX} y={moonY + moonR + 16} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={ACCENT3}>Moon (blood)</text>

          <text x={W/2} y={H - 12} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill={DIM}>
            Lunar eclipse: Moon enters Earth's shadow. Red light refracted through Earth's atmosphere illuminates it.
          </text>
        </svg>
      );
    }
  };

  return (
    <PageShell onBack={onBack} eyebrow="02 — Earth–Moon System"
               title={<>The <em style={{ color: ACCENT, fontStyle: 'italic' }}>Moon</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-8" style={{ color: '#c8c3b1' }}>
        Our nearest neighbour, the only other world humans have walked on, and the engine behind tides,
        eclipses, and a measurable slowing of Earth's rotation. Every detail of the Moon is wrapped up in
        the geometry of its orbit and the gravity that holds it.
      </p>

      {/* Fast facts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-10" style={{ background: BORDER }}>
        {[
          ['Mean distance', '384,400 km'],
          ['Diameter', '3,474 km (~¼ Earth)'],
          ['Orbital period', '27.32 days (sidereal)'],
          ['Mass', '7.35 × 10²² kg (1.2% Earth)'],
        ].map(([k, v]) => (
          <div key={k} className="p-4" style={{ background: BG }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>{k}</div>
            <div className="font-display text-base" style={{ color: INK }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-px mb-6" style={{ background: BORDER }}>
        {[
          ['phases', 'Phases & Orbit'],
          ['tides', 'Tides'],
          ['eclipses', 'Eclipses'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
                  className="p-4 text-center transition"
                  style={{ background: tab === id ? `${ACCENT}15` : BG,
                           borderTop: tab === id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-base" style={{ color: tab === id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{label}</div>
          </button>
        ))}
      </div>

      {tab === 'phases' && (
        <div className="fade-in">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
            Orbital geometry · click any phase
          </div>
          <div className="relative mb-4" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
            <OrbitDiagram ang={phase.ang} />
          </div>

          {/* Phase strip */}
          <div className="grid grid-cols-8 gap-px mb-6" style={{ background: BORDER }}>
            {MOON_PHASES.map((p, i) => (
              <button key={p.id} onClick={() => setPhaseIdx(i)}
                      className="p-3 text-center transition"
                      style={{ background: phaseIdx === i ? `${ACCENT}10` : BG }}>
                <div className="flex justify-center mb-2">
                  <MoonGlyph ang={p.ang} size={40} />
                </div>
                <div className="font-mono text-[9px] leading-tight" style={{ color: phaseIdx === i ? ACCENT : DIM }}>
                  {p.name}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-px mb-8" style={{ background: BORDER }}>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Phase</div>
              <div className="font-display text-base" style={{ color: INK }}>{phase.name}</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Illuminated</div>
              <div className="font-display text-base" style={{ color: INK }}>{Math.round(phase.illum * 100)}%</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Rises / sets</div>
              <div className="font-display text-base" style={{ color: INK }}>{phase.rise} / {phase.set}</div>
            </div>
            <div className="p-4" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Best seen</div>
              <div className="font-display text-base" style={{ color: INK }}>{phase.visible}</div>
            </div>
          </div>

          <Section title="The phases are a geometric illusion">
            <p>
              Half the Moon is always lit by the Sun — there is no actual "dark side." What changes is
              how much of that lit half we can see from Earth. The phase angle is simply the
              Sun–Moon–Earth angle: 0° at full, 180° at new, 90° at quarter.
            </p>
            <p>
              The dividing line on the Moon's disc — between lit and unlit — is the <em>terminator</em>.
              It moves across the Moon at ~15 km per hour (lunar surface speed) as the phase advances.
              The terminator is the best place to look with a small telescope: shadows are long there,
              and crater rims, mountains, and rilles stand out in sharp relief.
            </p>
          </Section>

          <Section title="Synodic vs sidereal month — two different periods">
            <p>
              The Moon orbits Earth in <strong style={{ color: ACCENT }}>27.32 days</strong> (sidereal
              month — return to the same star). But the time from one full moon to the next is
              <strong style={{ color: ACCENT }}> 29.53 days</strong> (synodic month). The difference is because
              Earth is also moving around the Sun, so the Moon has to "catch up" by an extra ~27° each
              orbit to be once again on the opposite side of Earth from the Sun.
            </p>
            <Eq>1 / T<sub>syn</sub> = 1 / T<sub>sid</sub> − 1 / T<sub>year</sub></Eq>
            <p>
              Plug in T<sub>sid</sub> = 27.32 d, T<sub>year</sub> = 365.25 d: T<sub>syn</sub> = 29.53 d.
              The synodic month is what drives the calendar — most lunar calendars (Islamic, Hebrew,
              Chinese) are built on it. 12 synodic months make 354 days, which is why the Islamic
              calendar drifts ~11 days per solar year against the Gregorian one.
            </p>
          </Section>

          <Section title="The Moon always shows the same face — tidal locking">
            <p>
              Look at a full moon any time and you see the same pattern of dark <em>maria</em> (the
              "Man in the Moon"). That's because the Moon's rotation period equals its orbital period
              — exactly 27.32 days. This is no coincidence: it's the inevitable result of
              <em> tidal locking</em>.
            </p>
            <p>
              Earth's gravity raises a tidal bulge on the Moon. If the Moon rotates faster than it
              orbits, the bulge gets dragged ahead of the Earth-Moon line, and Earth's gravity pulls
              backward on it — slowing the Moon's spin. The process runs to completion in ~10⁸ years
              for a body the size of our Moon. Result: synchronous rotation. The same physics has
              locked Mercury into a 3:2 spin-orbit resonance, and most large moons of the gas giants
              into 1:1 locks.
            </p>
            <p>
              We do see <em>slightly</em> more than 50% of the Moon over time — about 59% — because of
              <em> libration</em>: the Moon's orbit is eccentric and slightly tilted, so it appears to
              rock back and forth and nod up and down over a month. The Apollo missions exploited
              these librations to image regions just past the nominal limb.
            </p>
          </Section>
        </div>
      )}

      {tab === 'tides' && (
        <div className="fade-in">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
            The two tidal bulges
          </div>
          <div className="relative mb-8" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
            <TideDiagram />
          </div>

          <Section title="Why there are two high tides per day, not one">
            <p>
              The intuitive picture — Moon's gravity pulls the ocean toward it, making one bulge — is
              wrong. There are <em>two</em> bulges: one on the near side facing the Moon, one on the
              far side opposite to it. Most coasts have two high tides and two low tides every ~25 hours.
            </p>
            <p>
              The reason is that tides are a <em>differential</em> gravitational effect. The Moon pulls
              every part of Earth, but it pulls the near side a bit harder than Earth's centre, and
              Earth's centre a bit harder than the far side. In the frame of Earth's centre, water on
              the near side accelerates toward the Moon (because the Moon pulls it harder than it pulls
              the Earth's centre), and water on the far side accelerates <em>away</em> from the Moon
              (because the Moon pulls Earth's centre harder than it pulls the far-side water). Both
              cases produce a bulge.
            </p>
            <Eq>
              Tidal acceleration:  a<sub>tidal</sub> ≈ 2 G M r / d³
            </Eq>
            <p>
              Where M is the perturbing body's mass, d the distance to it, and r the radius of the
              perturbed body. The key feature: tidal force falls off as <strong>1/d³</strong>, not 1/d².
              That cube is why the Moon matters more for tides than the Sun, even though the Sun
              produces far more gravitational acceleration overall.
            </p>
          </Section>

          <Section title="Sun vs Moon — and why the Moon wins">
            <p>
              The Sun is 27 million times more massive than the Moon, but ~390 times further away.
              Plugging into the 1/d³ scaling: solar tidal force ≈ Moon's × (M<sub>☉</sub>/M<sub>moon</sub>) × (d<sub>moon</sub>/d<sub>☉</sub>)³
              ≈ 27 × 10⁶ / 390³ ≈ 0.46. So the Sun's tidal force is about half the Moon's.
            </p>
            <p>
              When Sun and Moon are aligned (new and full moons), their tidal effects add — giving
              extra-large <strong style={{ color: ACCENT }}>spring tides</strong>. When they're at right angles
              (quarter moons), they partly cancel — giving small <strong style={{ color: ACCENT }}>neap tides</strong>.
              The fortnightly spring-neap cycle is one of the most reliable signals in oceanography.
              "Spring" has nothing to do with the season — it's from the Old English for "to leap up."
            </p>
          </Section>

          <Section title="Tides actually drain energy from Earth's rotation">
            <p>
              Earth spins under the tidal bulges. Friction between the rotating ocean and the seafloor
              drags the bulges slightly ahead of the Earth-Moon line. That displaced near-side bulge
              has gravitational mass — and it pulls the Moon forward in its orbit, while the Moon's
              gravity pulls backward on the bulge, slowing Earth's spin.
            </p>
            <p>
              The numbers are real and measured:
              <br />
              <strong style={{ color: ACCENT }}>Earth's day is getting longer</strong> by about 2.3 milliseconds
              per century. Coral fossils from 400 million years ago record ~400 days per year (a 22-hour day).
              <br />
              <strong style={{ color: ACCENT }}>The Moon is receding from Earth</strong> at 3.8 cm/year, measured
              directly by laser ranging off the Apollo retroreflectors. Angular momentum lost from Earth's
              spin is transferred to the Moon's orbit.
            </p>
            <p>
              In the very long run (tens of billions of years), if nothing else intervened, Earth would
              tidally lock to the Moon — a 47-day Earth day, with the Moon hanging over a single point on
              Earth forever. But the Sun will become a red giant first, and the whole system gets
              disrupted long before this completes.
            </p>
          </Section>

          <Section title="Why a beach tide is metres, not centimetres">
            <p>
              The naive equilibrium tide — what you'd get on an ocean perfectly covering a smooth Earth —
              is only about <strong>54 cm</strong> for the Moon's contribution. Yet some coasts (Bay of
              Fundy in Canada, Severn Estuary in the UK) see tidal ranges over 15 m. The difference is
              <em> resonance</em>.
            </p>
            <p>
              Ocean basins have natural sloshing frequencies determined by their geometry. When that
              frequency is close to the ~12.4-hour tidal forcing period, the response is amplified —
              sometimes by an order of magnitude or more. The Bay of Fundy's natural period is about 13
              hours, very near resonance, which is why it has the largest tides in the world. The
              open Pacific, by contrast, has tidal ranges of just ~50 cm in the middle.
            </p>
          </Section>
        </div>
      )}

      {tab === 'eclipses' && (
        <div className="fade-in">
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
            Solar eclipse — Moon between Sun and Earth
          </div>
          <div className="relative mb-8" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
            <EclipseDiagram kind="solar" />
          </div>

          <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
            Lunar eclipse — Earth between Sun and Moon
          </div>
          <div className="relative mb-8" style={{ border: `1px solid ${BORDER}`, background: PANEL }}>
            <EclipseDiagram kind="lunar" />
          </div>

          <Section title="Why we don't have an eclipse every month">
            <p>
              Every new moon should be a solar eclipse and every full moon a lunar eclipse — if the
              Moon's orbit were in the same plane as Earth's orbit around the Sun. But the Moon's
              orbit is tilted by <strong style={{ color: ACCENT }}>5.14°</strong> relative to the ecliptic.
              Most months, the new moon passes above or below the Sun's disc as seen from Earth, and
              the full moon misses Earth's shadow.
            </p>
            <p>
              Eclipses can only happen when a new or full moon coincides with the Moon being near one
              of the two <em>nodes</em> — the points where its orbit crosses Earth's orbital plane.
              These alignments happen roughly twice a year, giving "eclipse seasons" lasting ~37 days
              each. The exact dates drift through the calendar because the lunar nodes themselves
              precess westward, completing a full circuit in 18.6 years.
            </p>
          </Section>

          <Section title="The Saros cycle — predicting eclipses">
            <p>
              The Babylonians noticed by ~600 BCE that eclipses repeat with a period of
              <strong style={{ color: ACCENT }}> 18 years 11 days 8 hours</strong>. We now call this the Saros.
              It arises from a triple coincidence: 223 synodic months = 242 draconic months = 239
              anomalistic months, all to within a few hours.
            </p>
            <p>
              Two eclipses one Saros apart have nearly the same geometry — same kind (solar/lunar),
              same approximate duration, same season. The 8-hour offset means each successive eclipse
              in a series shifts ~120° west in longitude on Earth, so any given Saros series is visible
              from a given location only every ~54 years. A complete Saros series lasts ~12–15 centuries
              and contains 70–80 eclipses.
            </p>
          </Section>

          <Section title="Total solar eclipses are a cosmic coincidence">
            <p>
              The Sun's diameter is ~400× the Moon's, but the Sun is ~400× farther away. So the two
              discs subtend almost exactly the same angle in the sky (~0.5°). This is why total solar
              eclipses look like they do — with the Moon perfectly covering the Sun's photosphere and
              revealing the corona.
            </p>
            <p>
              Nothing requires this. No other planet in our solar system has a moon that produces such
              precise total eclipses. And it's temporary: the Moon is receding at 3.8 cm/year, and in
              about 600 million years it will be too small to ever fully cover the Sun. From then on,
              all solar eclipses will be annular ("ring-of-fire"), with the Sun's edge visible around
              the Moon. We happen to live in the geological epoch when total solar eclipses exist.
            </p>
          </Section>

          <Section title="Why a totally eclipsed Moon turns red">
            <p>
              A totally eclipsed Moon — fully inside Earth's umbra — should be dark. Instead it glows
              dim copper-red, the famous "blood moon." The reason: Earth's atmosphere acts as a giant
              lens, refracting sunlight into the umbral shadow. Blue light is scattered away (the same
              Rayleigh scattering that makes our sky blue); the red light that makes it through reaches
              the Moon.
            </p>
            <p>
              An observer standing on the eclipsed Moon would see Earth in silhouette, ringed by a thin
              red glow — the combined sunrises and sunsets of every horizon on Earth, all at once. The
              exact shade depends on Earth's atmospheric conditions: after large volcanic eruptions
              (which loft dust and aerosols high into the stratosphere), lunar eclipses can be nearly
              black.
            </p>
          </Section>
        </div>
      )}

      {/* Origin section - always visible at the bottom */}
      <div className="mt-12 pt-8" style={{ borderTop: `1px solid ${BORDER}` }}>
        <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>Origin: the giant-impact hypothesis</h3>

        <Section title="A Mars-sized impactor, ~4.5 billion years ago">
          <p>
            The leading theory: ~30 million years after the solar system formed, a Mars-sized body
            traditionally named <em>Theia</em> struck the proto-Earth at a glancing angle. The impact
            vapourised much of Earth's mantle and a similar mass of Theia, ejecting a disc of molten
            silicate into orbit. The Moon coalesced from that disc within a few hundred years.
          </p>
          <p>
            This explains a series of otherwise puzzling facts: the Moon is unusually large relative
            to its planet (1.2% of Earth's mass — most moons are ~10⁻⁴ of their planet); the Moon has
            essentially no iron core (Theia's iron sank into Earth's core during the impact); the
            Moon's bulk composition matches Earth's mantle remarkably well; the Earth-Moon system
            has anomalously high angular momentum (the impact spun things up).
          </p>
          <p>
            The strongest single piece of evidence: oxygen isotope ratios. Different bodies in the
            solar system have measurably different ¹⁶O / ¹⁷O / ¹⁸O ratios. Earth and Moon are
            <em> identical</em> to within current measurement precision — implying they share a common
            origin or were thoroughly mixed by a giant impact. Mars, by contrast, has clearly distinct
            isotope ratios.
          </p>
        </Section>

        <Section title="Why the Moon matters for life on Earth">
          <p>
            Earth's spin axis is tilted 23.4° to its orbit, giving us seasons. The Moon stabilises this
            tilt — without it, gravitational nudges from the other planets would cause Earth's
            obliquity to wander chaotically between ~0° and ~85° over millions of years, with
            catastrophic climate consequences. Mars, with only two tiny moons, has obliquity excursions
            from ~10° to ~60°.
          </p>
          <p>
            Strong tidal mixing in shallow seas — driven by the Moon when it was much closer than today
            (just a few Earth radii away in the very early Earth) — may also have played a role in
            mixing organic chemistry and accelerating the origin of life. Whether this is essential or
            just helpful is an open question.
          </p>
        </Section>

        <Section title="Geology in a few sentences">
          <p>
            The dark patches we call <em>maria</em> ("seas") are basaltic lava plains, mostly formed
            3.0–3.8 billion years ago when large impacts cracked the crust and magma from the warm
            mantle flooded out. Maria cover ~16% of the surface, almost all on the near side — possibly
            because the near-side crust is thinner, a relic of an early thermal asymmetry.
          </p>
          <p>
            The bright <em>highlands</em> are older crust — anorthosite, made of the floated remains of
            a global magma ocean that crystallised in the Moon's first ~100 million years. Highland
            craters preserve a record of the inner solar system's bombardment history, especially the
            "Late Heavy Bombardment" centred ~3.9 Gyr ago.
          </p>
          <p>
            The Moon has no atmosphere, no magnetic field today (though it had one ~3.5 Gyr ago, now
            preserved in remanent magnetisation of returned samples), and no active volcanism. It is
            geologically dead at first order — but its interior is not perfectly cold. Lunar quakes
            detected by the Apollo seismometers reveal a small partially molten layer near the
            core-mantle boundary.
          </p>
        </Section>

        <Section title="Things still open">
          <p>
            <strong style={{ color: ACCENT }}>Exact dynamics of the giant impact</strong> — simulations show many
            scenarios that match observations; we don't know which is correct. Some recent models propose
            multiple smaller impacts instead.
          </p>
          <p>
            <strong style={{ color: ACCENT }}>Lunar water</strong> — once thought completely dry, the Moon is
            now known to contain water ice in permanently shadowed polar craters (LCROSS impact, 2009;
            LRO observations). The total amount, distribution, and origin (cometary delivery vs trapped
            from solar wind) are still being mapped — relevant for any sustained human presence.
          </p>
          <p>
            <strong style={{ color: ACCENT }}>The far side</strong> — the lunar far side has thicker crust, far
            fewer maria, and the largest impact basin in the solar system (the South Pole-Aitken basin,
            ~2,500 km across). Why the two sides differ so dramatically is still debated. China's
            Chang'e 4 and 6 missions are returning surface and sample data from this previously
            unvisited terrain.
          </p>
        </Section>

        <Photo src="https://www.nasa.gov/wp-content/uploads/2023/03/as11-44-6667.jpg"
               alt="Full Moon from Apollo 11"
               caption="The full Moon photographed from Apollo 11 during its trans-Earth journey, ~18,500 km from the Moon. The dark patches are the maria — basaltic lava plains from impacts 3.0–3.8 billion years ago. Notice their concentration on the near side; the far side has almost none, due to crustal thickness asymmetry."
               credit="NASA / Apollo 11" />

        <Playground
          title="Tidal force calculator"
          description="The tidal force on a body of radius r from a perturbing mass M at distance d scales as 2GMr/d³. Try comparing the Moon to the Sun, or to a hypothetical close neutron star."
          inputs={[
            { key: 'M', label: 'Perturbing mass', default: 7.35e22, min: 20, max: 30, log: true, unit: 'kg' },
            { key: 'd', label: 'Distance', default: 3.84e8, min: 6, max: 12, log: true, unit: 'm' },
          ]}
          compute={(v) => {
            const G = 6.674e-11;
            const r_earth = 6.371e6; // m
            const a_tidal = 2 * G * v.M * r_earth / Math.pow(v.d, 3);
            // Equilibrium tide height: 1/2 (a_tidal / g_earth) * r_earth
            const g = 9.81;
            const h_eq = 0.5 * (a_tidal / g) * r_earth;
            return { a_tidal, h_eq };
          }}
          outputs={[
            { key: 'a_tidal', label: 'Tidal acceleration at Earth\'s surface', unit: 'm/s²' },
            { key: 'h_eq', label: 'Equilibrium tide height', unit: 'm' },
          ]}
        />

        <WorkedExample title="Compute the synodic month"
                       steps={[
                         { text: 'The sidereal month (Moon\'s orbit relative to the stars) is 27.32 days. The synodic month (full moon to full moon) is longer because Earth is also moving around the Sun.',
                           eq: '1 / T_syn = 1 / T_sid − 1 / T_year' },
                         { text: 'Plug in: T_sid = 27.32 days, T_year = 365.25 days.',
                           eq: '1 / T_syn = 1/27.32 − 1/365.25 = 0.03661 − 0.00274 = 0.03387' },
                         { text: 'Invert.',
                           eq: 'T_syn = 1 / 0.03387 ≈ 29.53 days',
                           answer: '29.53 days. This is why a lunar calendar (12 synodic months = 354 days) drifts ~11 days per solar year against a solar calendar.' },
                       ]} />

        <Quiz questions={[
          { q: 'Why are there two high tides per day, not one?',
            options: ['The Moon orbits Earth twice per day', 'Tides are differential gravity — both near and far sides bulge', 'The Sun contributes one and the Moon contributes the other', 'Coriolis effect'],
            correct: 1,
            explain: 'The Moon\'s gravity pulls the near-side ocean more than Earth\'s centre, and Earth\'s centre more than the far-side ocean. Both effects produce a bulge — one toward the Moon, one away. As Earth rotates, every coast passes through both bulges per day.' },
          { q: 'When is the Moon highest in the sky?',
            options: ['Always around midnight', 'When it\'s full', 'Roughly when it transits the meridian, which depends on its phase', 'When it\'s new'],
            correct: 2,
            explain: 'The Moon is highest when it transits your local meridian. A full Moon transits around midnight (opposite the Sun); a first-quarter Moon transits at sunset; a new Moon transits at noon (alongside the Sun, invisible).' },
          { q: 'The Moon is receding from Earth at:',
            options: ['Not at all — distance is fixed', '3.8 cm per year', '3.8 m per year', '3.8 km per year'],
            correct: 1,
            explain: '3.8 cm/year, measured directly by laser ranging off the Apollo retroreflectors. Tidal friction drags Earth\'s bulges ahead of the Earth-Moon line; the gravitational pull on the Moon from those displaced bulges does positive work, transferring angular momentum from Earth\'s rotation to the Moon\'s orbit.' },
        ]} />

        <TryThis title="Verify these facts yourself"
                 items={[
                   { title: 'Predict the next full Moon', text: 'A full Moon occurs every 29.53 days. From any known full-Moon date (your phone\'s calendar shows them), count 29.53 days forward. Verify with a glance at the sky on that night.', gear: 'Calendar' },
                   { title: 'Watch the terminator over three nights', text: 'Photograph the Moon at the same time on three consecutive nights, especially around first quarter. The terminator visibly moves; specific craters that were in darkness one night are in sunlight the next. You\'re watching a lunar day unfold ~15× faster than an Earth day.', gear: 'Phone camera or binoculars' },
                   { title: 'Estimate the Moon\'s angular size', text: 'Hold a pencil at arm\'s length. The Moon\'s diameter is about ½° (0.5° of arc, ~10 mm wide at arm\'s length). Compare to your thumb — you\'ll find your thumb is several times wider. The fact that the Moon "looks bigger" near the horizon is a well-known optical illusion.', gear: 'Eyes, pencil' },
                 ]} />

        <OpenQuestions items={[
          { q: 'How exactly did the Moon form?',
            detail: '— The giant-impact hypothesis is broadly accepted but the details remain unclear. Single-impact models match isotope ratios only with very specific Theia compositions. Multiple-impact models (a series of smaller collisions) and synestia models (an impact-vaporised disc-cloud) are being actively explored.' },
          { q: 'Why is the lunar far side so different?',
            detail: '— The far-side crust is ~30 km thicker than the near-side, and far-side maria are nearly absent. Asymmetric tidal heating early in lunar history? An asymmetric impact (the giant South Pole-Aitken basin)? Compositional differences? Still unresolved.' },
          { q: 'How much water is actually at the lunar poles?',
            detail: '— LCROSS (2009) found water ice in a permanently shadowed crater; LRO has since mapped polar hydrogen abundance. But the depth, distribution, purity, and origin of this water remain uncertain. Critical for any sustained human lunar presence — and a target of NASA\'s Artemis programme.' },
          { q: 'Why is the Earth-Moon mass ratio so unusual?',
            detail: '— Most moons in the solar system are < 0.001 of their planet\'s mass. The Moon is 1.2% of Earth\'s. This is a strong constraint on formation scenarios — and it\'s why some authors call Earth-Moon a "double planet."' },
        ]} />
      </div>
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  12 · OBSERVATIONAL ASTRONOMY
// ═══════════════════════════════════════════════════════════════════════════

// Major constellations with their brightest stars and approximate positions
const CONSTELLATIONS = [
  { id: 'orion', name: 'Orion', latin: 'The Hunter',
    bestMonths: 'November – March (evening)',
    hemisphere: 'Equatorial · visible from both',
    desc: 'The most recognisable constellation in the sky. Its three belt stars in a perfect line, flanked by Betelgeuse (red supergiant) and Rigel (blue supergiant), make it unmistakable. Look just below the belt and you\'ll find the Orion Nebula (M42), a stellar nursery visible to the naked eye as a fuzzy patch.',
    // Stick-figure coordinates (relative, 0-1)
    stars: [
      { x: 0.30, y: 0.18, mag: 0.5, name: 'Betelgeuse', col: '#ff8a70' },
      { x: 0.72, y: 0.22, mag: 1.6, name: 'Bellatrix', col: '#aabfff' },
      { x: 0.42, y: 0.45, mag: 1.7, name: 'Alnitak', col: '#9bb0ff' },
      { x: 0.50, y: 0.47, mag: 1.6, name: 'Alnilam', col: '#9bb0ff' },
      { x: 0.58, y: 0.49, mag: 1.7, name: 'Mintaka', col: '#9bb0ff' },
      { x: 0.32, y: 0.78, mag: 0.18, name: 'Rigel', col: '#cad7ff' },
      { x: 0.75, y: 0.74, mag: 2.1, name: 'Saiph', col: '#aabfff' },
      { x: 0.48, y: 0.62, mag: 4.0, name: 'M42 (Orion Nebula)', col: '#ffc4b8' },
    ],
    lines: [[0,1],[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[5,6]],
    targets: [
      { name: 'Betelgeuse', tip: 'Visibly red, even to the naked eye. Compare to nearby Bellatrix.' },
      { name: 'Orion Nebula (M42)', tip: 'Fuzzy patch in the "sword" below the belt. Binoculars reveal nebulosity; small telescopes show the Trapezium cluster.' },
      { name: 'Horsehead Nebula', tip: 'Just below Alnitak. Requires dark skies and a telescope with hydrogen-alpha filter to see.' },
    ]
  },
  { id: 'ursa', name: 'Ursa Major', latin: 'The Great Bear',
    bestMonths: 'All year (northern hemisphere)',
    hemisphere: 'Northern · circumpolar above lat 41°N',
    desc: 'Contains the asterism known as the Big Dipper or Plough — seven bright stars in a saucepan shape. The two stars on the "front" of the bowl point directly to Polaris. The middle star of the handle (Mizar) has a famous naked-eye companion, Alcor — once a vision test.',
    stars: [
      { x: 0.85, y: 0.40, mag: 1.8, name: 'Dubhe', col: '#ffd2a1' },
      { x: 0.72, y: 0.32, mag: 2.4, name: 'Merak', col: '#cad7ff' },
      { x: 0.55, y: 0.38, mag: 2.4, name: 'Phecda', col: '#cad7ff' },
      { x: 0.50, y: 0.50, mag: 3.3, name: 'Megrez', col: '#fff4ea' },
      { x: 0.36, y: 0.45, mag: 1.8, name: 'Alioth', col: '#fff4ea' },
      { x: 0.22, y: 0.58, mag: 2.3, name: 'Mizar', col: '#fff4ea' },
      { x: 0.08, y: 0.62, mag: 1.9, name: 'Alkaid', col: '#cad7ff' },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[0,3]],
    targets: [
      { name: 'Mizar & Alcor', tip: 'Middle of the handle. Two stars visible to the naked eye on a dark night.' },
      { name: 'Find Polaris', tip: 'Draw a line from Merak through Dubhe and extend it ~5× further — you reach Polaris.' },
      { name: 'M81 & M82 galaxies', tip: 'A pair of galaxies above the bowl. Binoculars show them as faint smudges; a telescope reveals structure.' },
    ]
  },
  { id: 'cas', name: 'Cassiopeia', latin: 'The Queen',
    bestMonths: 'All year (northern hemisphere)',
    hemisphere: 'Northern · circumpolar above lat 35°N',
    desc: 'A distinctive W or M shape, depending on the time of year. Opposite the Big Dipper across Polaris — when one is high in the sky, the other is low. Located in a rich Milky Way star field with many open clusters.',
    stars: [
      { x: 0.12, y: 0.30, mag: 2.2, name: 'Segin', col: '#aabfff' },
      { x: 0.30, y: 0.55, mag: 2.7, name: 'Ruchbah', col: '#fff4ea' },
      { x: 0.50, y: 0.25, mag: 2.5, name: 'Navi', col: '#cad7ff' },
      { x: 0.70, y: 0.50, mag: 2.2, name: 'Schedar', col: '#ffd2a1' },
      { x: 0.88, y: 0.30, mag: 2.3, name: 'Caph', col: '#fff4ea' },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4]],
    targets: [
      { name: 'Double Cluster (NGC 869/884)', tip: 'Between Cassiopeia and Perseus. A pair of brilliant open clusters visible to the naked eye and stunning in binoculars.' },
      { name: 'Andromeda Galaxy', tip: 'From Cassiopeia point toward the right side (the deeper "V"); Andromeda is the next constellation.' },
    ]
  },
  { id: 'cyg', name: 'Cygnus', latin: 'The Swan',
    bestMonths: 'June – November',
    hemisphere: 'Northern',
    desc: 'A cross of bright stars in the Milky Way (sometimes called the "Northern Cross"). The swan flies south down the band of our galaxy, with Deneb marking the tail and Albireo at the head. Albireo through any telescope is one of the great visual treats of astronomy — a vivid orange-blue double star.',
    stars: [
      { x: 0.50, y: 0.10, mag: 1.25, name: 'Deneb', col: '#cad7ff' },
      { x: 0.50, y: 0.40, mag: 2.2, name: 'Sadr', col: '#fff4ea' },
      { x: 0.50, y: 0.75, mag: 3.1, name: 'Albireo', col: '#ffd2a1' },
      { x: 0.22, y: 0.42, mag: 2.5, name: 'Gienah', col: '#ffd2a1' },
      { x: 0.78, y: 0.42, mag: 2.5, name: 'Fawaris', col: '#cad7ff' },
    ],
    lines: [[0,1],[1,2],[1,3],[1,4]],
    targets: [
      { name: 'Albireo', tip: 'Point any telescope at the head of the swan. A magnificent gold + blue double, ~430 ly distant.' },
      { name: 'Milky Way through Cygnus', tip: 'Look at Cygnus on a dark night — you\'re looking down the Orion Spur of our galaxy.' },
      { name: 'North America Nebula', tip: 'A continent-shaped nebula near Deneb. Hard to see visually; great in photographs.' },
    ]
  },
  { id: 'leo', name: 'Leo', latin: 'The Lion',
    bestMonths: 'February – May',
    hemisphere: 'Equatorial',
    desc: 'A real lion shape, with a backwards-question-mark "sickle" forming the head and mane, and a triangle of stars at the rump. Regulus, at the base of the sickle, is one of the closest very bright stars to the ecliptic — it\'s often near the Moon and planets.',
    stars: [
      { x: 0.20, y: 0.30, mag: 1.4, name: 'Regulus', col: '#aabfff' },
      { x: 0.25, y: 0.22, mag: 2.0, name: 'Algieba', col: '#ffd2a1' },
      { x: 0.30, y: 0.12, mag: 2.6, name: 'Adhafera', col: '#fff4ea' },
      { x: 0.38, y: 0.10, mag: 3.4, name: 'Algenubi', col: '#ffd2a1' },
      { x: 0.40, y: 0.20, mag: 3.5, name: 'Rasalas', col: '#ffd2a1' },
      { x: 0.50, y: 0.40, mag: 3.4, name: 'Chertan', col: '#fff4ea' },
      { x: 0.75, y: 0.50, mag: 2.1, name: 'Denebola', col: '#fff4ea' },
      { x: 0.60, y: 0.55, mag: 3.3, name: 'Zosma', col: '#fff4ea' },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,1],[1,5],[5,6],[5,7],[7,6]],
    targets: [
      { name: 'Leo Triplet', tip: 'A trio of galaxies (M65, M66, NGC 3628) below the lion. Visible in small telescopes.' },
      { name: 'Regulus and the ecliptic', tip: 'Watch Regulus through a year — the Moon and bright planets will repeatedly pass near it.' },
    ]
  },
  { id: 'scorpio', name: 'Scorpius', latin: 'The Scorpion',
    bestMonths: 'May – August (low in southern sky from temperate north)',
    hemisphere: 'Southern · best below lat 40°N',
    desc: 'One of the few constellations that genuinely looks like its namesake — a curving body and stinger like a scorpion. Antares ("rival of Mars") glows red at its heart. Located on the Milky Way toward the galactic centre, the region is dense with clusters and nebulae.',
    stars: [
      { x: 0.18, y: 0.20, mag: 2.6, name: 'Acrab', col: '#aabfff' },
      { x: 0.22, y: 0.28, mag: 2.3, name: 'Dschubba', col: '#aabfff' },
      { x: 0.20, y: 0.38, mag: 2.9, name: 'Pi Sco', col: '#aabfff' },
      { x: 0.30, y: 0.45, mag: 1.1, name: 'Antares', col: '#ff8a70' },
      { x: 0.42, y: 0.55, mag: 2.9, name: 'Tau Sco', col: '#aabfff' },
      { x: 0.55, y: 0.65, mag: 1.9, name: 'Epsilon Sco', col: '#ffd2a1' },
      { x: 0.62, y: 0.78, mag: 3.0, name: 'Mu Sco', col: '#aabfff' },
      { x: 0.55, y: 0.88, mag: 1.6, name: 'Shaula', col: '#aabfff' },
      { x: 0.45, y: 0.92, mag: 2.7, name: 'Lesath', col: '#aabfff' },
    ],
    lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]],
    targets: [
      { name: 'Antares', tip: 'Visibly red and ~700× the Sun\'s diameter. A red supergiant nearing the end of its life.' },
      { name: 'M4 globular cluster', tip: 'Just to the right of Antares. The closest globular to Earth at ~7,200 ly.' },
      { name: 'Galactic centre region', tip: 'Sweep with binoculars between Scorpius and Sagittarius for one of the richest views in the sky.' },
    ]
  },
];

function ConstellationDiagram({ constellation: c, size = 360 }) {
  const W = size, H = size * 0.85;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ background: '#020208' }}>
      {/* Faint background stars */}
      {Array.from({ length: 80 }).map((_, i) => {
        const x = ((i * 37) % 100) / 100 * W;
        const y = ((i * 53) % 100) / 100 * H;
        const r = ((i * 7) % 10) / 30;
        return <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.3} />;
      })}

      {/* Constellation lines */}
      {c.lines.map(([a, b], i) => {
        const sA = c.stars[a], sB = c.stars[b];
        return (
          <line key={i} x1={sA.x * W} y1={sA.y * H} x2={sB.x * W} y2={sB.y * H}
                stroke={ACCENT} strokeWidth="0.6" opacity="0.4" />
        );
      })}

      {/* Stars */}
      {c.stars.map((s, i) => {
        // Brighter (lower magnitude) = bigger circle
        const r = Math.max(1.5, 6 - s.mag * 0.8);
        return (
          <g key={i}>
            <circle cx={s.x * W} cy={s.y * H} r={r + 3} fill={s.col} opacity="0.2" />
            <circle cx={s.x * W} cy={s.y * H} r={r} fill={s.col} />
            <text x={s.x * W + r + 4} y={s.y * H + 3}
                  fontFamily="JetBrains Mono, monospace" fontSize="9" fill={INK} opacity="0.7">
              {s.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// Light pollution / Bortle scale
const BORTLE = [
  { class: '1', sky: 'Excellent dark site', limit: 7.6, mw: 'Milky Way casts shadows. Zodiacal light, gegenschein, airglow visible.', where: 'Remote deserts, ocean islands, high mountains', col: '#000' },
  { class: '2', sky: 'Typical truly dark site', limit: 7.1, mw: 'Milky Way highly structured. M33 easily naked-eye.', where: 'National parks far from cities', col: '#0a0a18' },
  { class: '3', sky: 'Rural sky', limit: 6.6, mw: 'Milky Way shows complex structure. Some light domes from distant cities.', where: 'Most rural areas', col: '#181830' },
  { class: '4', sky: 'Rural / suburban transition', limit: 6.1, mw: 'Milky Way still visible but washed out near horizon. Light pollution domes obvious.', where: 'Outskirts of small towns', col: '#283050' },
  { class: '5', sky: 'Suburban sky', limit: 5.6, mw: 'Milky Way very weak or invisible near horizon. M31 (Andromeda) barely naked-eye.', where: 'Suburban neighbourhoods', col: '#404870' },
  { class: '6', sky: 'Bright suburban sky', limit: 5.1, mw: 'Milky Way invisible. Clouds appear orange. Sky has greyish background.', where: 'Larger suburbs', col: '#605c70' },
  { class: '7', sky: 'Suburban / urban transition', limit: 4.6, mw: 'Sky shows strong light pollution. Only brightest constellations visible.', where: 'Inner suburbs of cities', col: '#807870' },
  { class: '8', sky: 'City sky', limit: 4.1, mw: 'Only Moon, planets, and brightest stars visible. Constellations hard to identify.', where: 'Urban areas', col: '#a0907a' },
  { class: '9', sky: 'Inner-city sky', limit: 4.0, mw: 'Only ~10–20 brightest stars visible. Even the brightest constellations dissolved.', where: 'Downtown cities', col: '#b89c70' },
];

function ObservationalAstronomy({ onBack }) {
  const [tab, setTab] = useState('constellations');
  const [conIdx, setConIdx] = useState(0);
  const c = CONSTELLATIONS[conIdx];

  const [bortle, setBortle] = useState(4);
  const bortleData = BORTLE[bortle - 1];

  // What to look for - by category
  return (
    <PageShell onBack={onBack} eyebrow="01 — Looking Up"
               title={<>Observational <em style={{ color: ACCENT, fontStyle: 'italic' }}>Astronomy</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Astronomy started by stepping outside and looking up. That's still the most direct connection
        to the cosmos available. This topic is about what you can actually see — with eyes, binoculars,
        or a small telescope — and how to find it.
      </p>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-px mb-6" style={{ background: BORDER }}>
        {[
          ['constellations', 'Constellations'],
          ['gear', 'Eyes, Binos, Scopes'],
          ['bortle', 'Light Pollution'],
          ['planets', 'Planets & Moon'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
                  className="p-4 text-center transition"
                  style={{ background: tab === id ? `${ACCENT}15` : BG,
                           borderTop: tab === id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-sm md:text-base" style={{ color: tab === id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{label}</div>
          </button>
        ))}
      </div>

      {tab === 'constellations' && (
        <div className="fade-in">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-px mb-6" style={{ background: BORDER }}>
            {CONSTELLATIONS.map((con, i) => (
              <button key={con.id} onClick={() => setConIdx(i)}
                      className="p-3 text-center transition"
                      style={{ background: conIdx === i ? `${ACCENT}10` : BG,
                               borderTop: conIdx === i ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
                <div className="font-display text-sm" style={{ color: conIdx === i ? ACCENT : INK }}>{con.name}</div>
                <div className="font-mono text-[9px] mt-1" style={{ color: DIM }}>{con.latin}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 fade-in" key={c.id}>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-3" style={{ color: ACCENT }}>
                {c.name} · {c.latin}
              </div>
              <div className="relative mb-6" style={{ border: `1px solid ${BORDER}` }}>
                <ConstellationDiagram constellation={c} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px mb-6" style={{ background: BORDER }}>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Best seen</div>
                  <div className="font-display text-sm" style={{ color: INK }}>{c.bestMonths}</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Visibility</div>
                  <div className="font-display text-sm" style={{ color: INK }}>{c.hemisphere}</div>
                </div>
              </div>

              <p className="font-display text-base leading-relaxed" style={{ color: '#c8c3b1' }}>{c.desc}</p>
            </div>

            <aside style={{ borderLeft: `1px solid ${BORDER}` }}>
              <div className="pl-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.25em] mb-4" style={{ color: ACCENT }}>What to look for</div>
                <ul className="space-y-5">
                  {c.targets.map((t, i) => (
                    <li key={i}>
                      <div className="font-display text-base mb-1" style={{ color: INK }}>{t.name}</div>
                      <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{t.tip}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>

          <TryThis title="Find these in the real sky"
                   items={[
                     { title: 'Star-hop from a known constellation', text: 'Pick any constellation here that\'s visible tonight. Find it. Then trace a known "pointer" (e.g. Dubhe → Merak → Polaris). This is the most basic and durable astronomy skill — it never stops being useful.', gear: 'Eyes' },
                     { title: 'Estimate sky brightness from naked-eye limit', text: 'Find the faintest star you can see with no optical aid in a familiar constellation. Look up its apparent magnitude. That number is your local limit — and a rough Bortle indicator.', gear: 'Eyes + a star chart app' },
                     { title: 'Spot Mizar and Alcor', text: 'Look at the middle of the Big Dipper\'s handle on a dark night. Two stars separated by ~12 arcminutes (about ⅓ the Moon\'s diameter). Once a vision test in the Roman army.', gear: 'Eyes (dark sky helps)' },
                     { title: 'Photograph a constellation', text: 'Any phone on a tripod, 10-second exposure, manual mode. Most modern phones will pick up dozens of stars and the rough shape of bright constellations. Try Orion, the Big Dipper, or Cassiopeia.', gear: 'Phone + tripod or stable surface' },
                   ]} />

          <Quiz questions={[
            { q: 'Which three stars form the most identifiable feature of Orion?',
              options: ['The shoulders and feet', 'The three belt stars', 'The sword stars', 'Betelgeuse, Bellatrix, and Rigel'],
              correct: 1,
              explain: 'The three nearly-perfectly-aligned belt stars (Alnitak, Alnilam, Mintaka) are the most recognisable feature. They\'re also a useful pointer: extending the belt leads to Sirius (to the south-east) and Aldebaran (to the north-west).' },
            { q: 'You can see the Big Dipper year-round if you live above which latitude?',
              options: ['25°N', '41°N', '60°N', '74°N'],
              correct: 1,
              explain: 'Above ~41°N the Big Dipper is "circumpolar" — it never sets. London (51°N), New York (40°N marginally), Berlin (52°N), and Moscow (55°N) qualify. Tokyo (35°N) and Miami (25°N) do not.' },
            { q: 'Why does Antares appear visibly red?',
              options: ['Atmospheric reddening', 'It\'s very far away', 'Its surface temperature is only ~3,600 K', 'It\'s receding rapidly (redshift)'],
              correct: 2,
              explain: 'Antares is a red supergiant with a surface temperature around 3,600 K. By Wien\'s law its peak emission is in the near-infrared, with the visible part of its spectrum heavily weighted toward the red. Cool = red is a fundamental colour-temperature relationship.' },
          ]} />
        </div>
      )}

      {tab === 'gear' && (
        <div className="fade-in">
          <h3 className="font-display text-2xl mb-6" style={{ letterSpacing: '-0.01em' }}>What you can see with what</h3>

          <div className="space-y-6 mb-10">
            {[
              { gear: 'Naked eye', mag: '~6 (dark site), ~3 (city)', sees: 'Brightest few thousand stars, all the major constellations, the Milky Way (dark sky), the Moon\'s phases and major maria, all five naked-eye planets, meteors, satellites, M31 Andromeda Galaxy (dark sky), M42 Orion Nebula' },
              { gear: 'Binoculars (7×50 or 10×50)', mag: '~10', sees: 'Hundreds of thousands of stars, Jupiter\'s four Galilean moons, lunar craters and rilles, the brightest open clusters (M45 Pleiades is stunning), brightest globular clusters as fuzzy "stars", brightest nebulae and galaxies as faint smudges, comets, asteroids near opposition' },
              { gear: 'Small telescope (4–6")', mag: '~13', sees: 'Saturn\'s rings, Jupiter\'s cloud bands, Mars polar caps, Venus phases, lunar detail down to ~1 km, double stars (Albireo is a classic), most Messier objects, planetary nebulae, structure in brighter galaxies' },
              { gear: 'Medium telescope (8–12")', mag: '~15', sees: 'Spiral arms in bright galaxies, dust lanes, fainter clusters, more planetary nebulae, Uranus and Neptune as discs, asteroid shapes (rotation), exoplanet transits (with photometry)' },
              { gear: 'Large amateur (16"+)', mag: '~17', sees: 'Faint galaxies in nearby clusters, spectroscopic features, supernovae in other galaxies, fine planetary detail. Diminishing returns from atmosphere — bigger doesn\'t help without good seeing.' },
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[200px_120px_1fr] gap-6 p-4 rounded" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT }}>Gear</div>
                  <div className="font-display text-lg" style={{ color: INK, letterSpacing: '-0.01em' }}>{row.gear}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT }}>Limit mag</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{row.mag}</div>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT }}>What you can see</div>
                  <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{row.sees}</div>
                </div>
              </div>
            ))}
          </div>

          <Section title="Why aperture matters more than magnification">
            <p>
              The most common beginner mistake is to ask "how much does it magnify?" The right question
              is "how big is the lens or mirror?" The collecting area determines how many photons you
              gather per second. A larger aperture lets you see fainter things at <em>any</em> magnification.
              Magnification is just spreading those photons over more of your eye — past a certain
              point you're just magnifying noise.
            </p>
            <p>
              Useful maximum magnification on a small scope is roughly <strong>50× per inch of aperture</strong>.
              A 4" scope can do ~200× before the image starts to break down. The atmosphere usually
              limits real-world performance below this.
            </p>
            <Eq>Light gathering ∝ D²,  where D = aperture diameter</Eq>
          </Section>

          <Section title="Useful number: the dark-adaptation rule">
            <p>
              Your eyes take about <strong>20–30 minutes</strong> to fully adapt to darkness. A single
              glance at a bright phone screen resets the process completely. Use a red light (most
              astronomy apps have a "red night mode") and avoid white light entirely while observing.
            </p>
            <p>
              Fully dark-adapted, your eye's pupil opens to ~7 mm in young observers, less with age.
              This sets a hard limit on how much benefit you get from a telescope's exit pupil — pick
              eyepiece + scope combinations so the exit pupil (eyepiece focal length ÷ scope f-ratio) is
              no larger than your dilated pupil. Beyond that, you're just wasting light.
            </p>
          </Section>

          <TryThis title="Build observation skills"
                   items={[
                     { title: 'A week of Jupiter\'s moons', text: 'Sketch Jupiter and the positions of its four bright moons (Io, Europa, Ganymede, Callisto) each clear night for a week. You\'ll see them swap positions as they orbit. The same observation Galileo made in 1610 that broke the geocentric universe.', gear: 'Binoculars (10×50) or any telescope' },
                     { title: 'Lunar terminator sketches', text: 'Pick a single crater near the terminator (the day-night boundary) and sketch it over three consecutive evenings. The shadows will be utterly different each night — the same crater, same scope, three very different views.', gear: 'Small telescope, pencil, paper' },
                     { title: 'Star colour estimation', text: 'Pick a bright star (Betelgeuse, Antares, Rigel, Vega) and consciously notice its colour. Compare to a neighbour. Then look up the surface temperatures and check — you\'re doing applied stellar spectroscopy.', gear: 'Eyes' },
                     { title: 'A meteor count', text: 'During a meteor shower (Perseids in August, Geminids in December), lie back and count meteors per hour for a 30-minute window. Compare to the predicted "ZHR" (zenithal hourly rate) — the difference is your sky\'s transparency.', gear: 'Eyes, blanket, dark sky' },
                   ]} />
        </div>
      )}

      {tab === 'bortle' && (
        <div className="fade-in">
          <p className="font-display text-base leading-relaxed mb-8 max-w-3xl" style={{ color: '#c8c3b1' }}>
            The Bortle scale rates sky darkness from 1 (truly dark) to 9 (inner city). Your local
            class determines what's even possible — there's no telescope that can punch through a
            Bortle 9 sky to see the Milky Way.
          </p>

          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-3">
              <div className="font-mono text-xs uppercase tracking-[0.25em]" style={{ color: ACCENT }}>Bortle class</div>
              <div className="font-display text-3xl" style={{ letterSpacing: '-0.01em' }}>{bortle}</div>
            </div>
            <input type="range" min="1" max="9" step="1" value={bortle}
                   onChange={e => setBortle(parseInt(e.target.value))} className="w-full" />
            <div className="flex justify-between mt-2">
              {[1,2,3,4,5,6,7,8,9].map(b => (
                <button key={b} onClick={() => setBortle(b)}
                        className="font-mono text-[10px] hover:text-white transition"
                        style={{ color: b === bortle ? ACCENT : DIM }}>{b}</button>
              ))}
            </div>
          </div>

          <div className="fade-in" key={bortle}>
            <div className="p-6 mb-6 rounded" style={{ background: bortleData.col, border: `1px solid ${BORDER_STRONG}` }}>
              <div className="font-display text-2xl mb-2" style={{ color: bortleData.class >= '6' ? '#000' : '#fff', letterSpacing: '-0.01em' }}>
                Class {bortleData.class} — {bortleData.sky}
              </div>
              <div className="font-mono text-xs" style={{ color: bortleData.class >= '6' ? '#000' : '#ccc' }}>
                Naked-eye limit: ~{bortleData.limit} mag
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px mb-8" style={{ background: BORDER }}>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: ACCENT }}>What the sky looks like</div>
                <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{bortleData.mw}</div>
              </div>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: ACCENT }}>Where you find it</div>
                <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{bortleData.where}</div>
              </div>
            </div>
          </div>

          <Section title="Why light pollution matters astronomically and not just aesthetically">
            <p>
              Light pollution isn't a small effect. Going from Bortle 4 to Bortle 7 — a change you might
              experience by moving from a rural town to a small city — costs you about <strong>3 magnitudes</strong>
              of sky depth. That's a factor of ~16× in flux. <Term k="ism">The Milky Way</Term> becomes
              invisible; thousands of stars vanish; nebulae disappear entirely.
            </p>
            <p>
              The fastest-growing form is blue-rich LED street lighting, which scatters more strongly
              in the atmosphere than the older sodium lamps it replaced. The International Dark-Sky
              Association advocates for warm (≤3000 K), shielded, downward-pointing fixtures — which
              also save energy and improve human circadian health.
            </p>
            <p>
              For astrophotography, light pollution can be partially filtered out — narrowband filters
              isolate specific emission lines (Hα, OIII) that are unaffected by broadband city glare.
              You can do remarkable deep-sky imaging from a Bortle 7 backyard with the right filters.
              Visual observation has no such workaround.
            </p>
          </Section>
        </div>
      )}

      {tab === 'planets' && (
        <div className="fade-in">
          <p className="font-display text-base leading-relaxed mb-8 max-w-3xl" style={{ color: '#c8c3b1' }}>
            The five naked-eye planets — Mercury, Venus, Mars, Jupiter, Saturn — have been known since
            antiquity. Uranus and Neptune are recent additions (1781 and 1846). Here's how to find and
            recognise them.
          </p>

          <div className="space-y-6 mb-10">
            {[
              { name: 'Mercury', mag: '−2 to +5', visible: 'Briefly at dawn or dusk, never far from the Sun. Visible at "elongations" every ~3 months for ~2 weeks each.', look: 'Bright "star" close to the horizon at twilight. Through a telescope: small phases like a tiny Moon.' },
              { name: 'Venus', mag: '−4.7 to −3', visible: '"Morning star" or "evening star" — always near the Sun but often dazzlingly bright. Visible for months at a time.', look: 'The brightest non-Moon object in the sky. Through a telescope: shows phases like the Moon — Galileo\'s discovery that disproved geocentrism.' },
              { name: 'Mars', mag: '−2.9 to +1.8', visible: 'Every ~2 years comes to opposition and is visible all night. Other times it\'s in the morning or evening sky.', look: 'Distinctly red-orange. Through a telescope at opposition: polar ice caps, dark surface features like Syrtis Major.' },
              { name: 'Jupiter', mag: '−2.9 to −1.6', visible: 'Up about half of every night for most of every year. Easy to find — second-brightest planet after Venus.', look: 'Bright steady yellow-white "star." Binoculars show 4 moons in a line; a small scope shows the cloud bands and Great Red Spot.' },
              { name: 'Saturn', mag: '+0.5 to +1.5', visible: 'Up about half of every year. Fainter than Jupiter but still naked-eye easy.', look: 'Pale yellow. Through any telescope: the rings — astronomy\'s most reliable jaw-drop moment.' },
            ].map(p => (
              <div key={p.name} className="p-5 rounded" style={{ background: PANEL, border: `1px solid ${BORDER}` }}>
                <div className="flex items-baseline justify-between mb-3">
                  <h4 className="font-display text-2xl" style={{ letterSpacing: '-0.01em' }}>{p.name}</h4>
                  <div className="font-mono text-xs" style={{ color: DIM }}>mag {p.mag}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT }}>When to look</div>
                    <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{p.visible}</div>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: ACCENT }}>How to recognise</div>
                    <div className="font-display text-sm leading-relaxed" style={{ color: '#c8c3b1' }}>{p.look}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Section title="How to tell planets from stars">
            <p>
              Three ways, in order of reliability:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Planets don't twinkle</strong> (much). Stars twinkle because
              they're effectively point sources, and atmospheric turbulence wobbles their image around.
              Planets have a small but real angular size, so the wobble averages out. If a "bright star"
              shines steadily and the ones around it twinkle — that's a planet.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Planets are on the ecliptic.</strong> Mercury, Venus, Mars,
              Jupiter, and Saturn all stick close to the same arc across the sky — the path of the Sun
              and Moon. If you see a bright object very high overhead, far from where the Sun travels,
              it's not a planet.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Planets move between constellations</strong> over weeks and
              months. Watch the same patch of sky over a season and a planet will visibly shift against
              the fixed stars. The word "planet" comes from the Greek <em>planētēs</em> — wanderer.
            </p>
          </Section>

          <Section title="Looking at the Moon">
            <p>
              The single most rewarding object in amateur astronomy. The Moon shows different terrain
              every night as the terminator (day-night boundary) moves across it — shadows are long
              there, and craters, mountains, and rilles leap out in relief.
            </p>
            <p>
              Best time to look: anywhere between first quarter and a few days before full. A full Moon
              is actually a <em>bad</em> time to observe lunar detail — with no shadows, the surface
              looks flat and washed out.
            </p>
            <p>
              Three lunar features worth knowing:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Tycho</strong> — the youngest big crater on the near side
              (~108 Myr), with bright "rays" streaking across the southern highlands. Easy in any optic.<br />
              <strong style={{ color: ACCENT }}>Copernicus</strong> — magnificent terraced crater walls, central
              peaks, ejecta blanket. Even a small scope shows it spectacularly.<br />
              <strong style={{ color: ACCENT }}>The Apennines</strong> — a mountain range bordering Mare Imbrium.
              Apollo 15 landed at the base. Best seen near first quarter.
            </p>
          </Section>

          <Section title="Satellites — the modern night sky">
            <p>
              On any clear evening you can see ~10–30 satellites drifting steadily across the sky in
              an hour. The brightest is the International Space Station, which can briefly outshine
              every star except Sirius (~mag −4 at favourable passes). Tools like Heavens-Above and
              Stellarium predict passes for your exact location.
            </p>
            <p>
              The recent Starlink mega-constellation has added thousands of bright satellites to the
              sky — sometimes visible as "trains" of newly launched satellites in formation before they
              spread out. Astronomers have raised significant concerns about their impact on professional
              observatories.
            </p>
          </Section>

          <TryThis title="Plan an observation session"
                   items={[
                     { title: 'Find what\'s up tonight', text: 'Install Stellarium (free, exists for phone and desktop) or use the website. Set your location. Look at what crosses the meridian tonight, what time it transits, and what its altitude will be. Plan to look at it then.', gear: 'Free app' },
                     { title: 'Catch an ISS pass', text: 'Heavens-Above.com or NASA\'s Spot The Station tells you exactly when and where to look. The ISS is unmistakable — bright as Jupiter, moving visibly, no flashing lights, crosses the sky in 3–5 minutes.', gear: 'Eyes' },
                     { title: 'Watch a sunset planet', text: 'On any clear evening just after sunset, look toward the western horizon. If Venus is in evening apparition, you can\'t miss it. Watch it set — and notice how it moves with the rotation of the sky, not your local landscape.', gear: 'Eyes' },
                   ]} />
        </div>
      )}

      <OpenQuestions items={[
        { q: 'Why is the night sky dark?',
          detail: '— "Olbers\' paradox." In a static, infinite, eternal universe filled uniformly with stars, every line of sight should eventually hit a star, and the sky should be as bright as the average stellar surface. The resolution is a combination of cosmic expansion, finite age, and absorption — but the original question is profound. The darkness of the sky is direct observational evidence that the universe is not static and eternal.' },
        { q: 'Are we losing the night sky for good?',
          detail: '— Studies show ~80% of the world\'s population now lives under light-polluted skies. ~one-third of humanity can no longer see the Milky Way from where they live. Whether dark skies can be restored in populated areas is partly a technical question (smarter lighting) and partly a political and economic one.' },
        { q: 'What\'s the future of professional ground-based astronomy?',
          detail: '— With LEO satellite constellations growing and atmospheric seeing limits unchanged, some areas of professional astronomy are migrating to space. But the cost ratio (~$1B for a Roman-class space telescope vs ~$300M for a comparable ground scope) keeps ground-based work essential. Adaptive optics has narrowed the seeing gap dramatically.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  13 · SPECIAL RELATIVITY ESSENTIALS
// ═══════════════════════════════════════════════════════════════════════════

function SpecialRelativity({ onBack }) {
  const [tab, setTab] = useState('foundations');
  const [v, setV] = useState(0.6); // velocity as fraction of c

  const gamma = 1 / Math.sqrt(1 - v * v);

  return (
    <PageShell onBack={onBack} eyebrow="17 — Spacetime"
               title={<>Special <em style={{ color: ACCENT, fontStyle: 'italic' }}>Relativity</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Einstein's 1905 reformulation of mechanics. Two postulates — physics is the same in every
        inertial frame, and the speed of light is the same in every frame — and the rest is
        consequences. Time dilates, lengths contract, mass and energy turn out to be the same thing.
      </p>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-px mb-6" style={{ background: BORDER }}>
        {[
          ['foundations', 'Foundations'],
          ['lorentz', 'The Lorentz Factor'],
          ['phenomena', 'Time, Length, Mass'],
          ['paradoxes', 'Paradoxes & Tests'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
                  className="p-4 text-center transition"
                  style={{ background: tab === id ? `${ACCENT}15` : BG,
                           borderTop: tab === id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-sm md:text-base" style={{ color: tab === id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{label}</div>
          </button>
        ))}
      </div>

      {tab === 'foundations' && (
        <div className="fade-in">
          <Section title="The two postulates">
            <p>
              Einstein in 1905 built all of special relativity from two assumptions:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>1. The principle of relativity.</strong> The laws of physics
              are identical in every inertial (non-accelerating) reference frame. No experiment can tell
              you whether you are at rest or moving at constant velocity — only relative motion is meaningful.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>2. The invariance of c.</strong> The speed of light in vacuum
              is the same value — c = 299,792,458 m/s — for every observer, no matter how they move relative
              to the source. A flashlight from a passing rocket emits photons that you measure at c, exactly
              as if the rocket were at rest.
            </p>
            <p>
              These postulates seem innocuous. Their consequences are not.
            </p>
          </Section>

          <Section title="Why these specifically?">
            <p>
              The first postulate goes back to Galileo. The second was forced by experiment: the 1887
              Michelson–Morley measurement showed that the speed of light didn't depend on Earth's motion
              around the Sun. Earlier physicists tried to preserve a luminiferous "aether" with elaborate
              fixes (length-contracting matter, dragging-aether theories). Einstein simply accepted the
              experimental result and worked through the consequences.
            </p>
            <p>
              What had to be abandoned: the assumption that simultaneity is absolute, that lengths are
              the same in all frames, that masses are constant. What survived: causality, momentum
              conservation (reformulated), energy conservation (reformulated). And out of the rubble fell
              one of the most famous equations in physics: <Term k="binding energy">E = mc²</Term>.
            </p>
          </Section>

          <Section title="What special relativity does not handle">
            <p>
              Special relativity covers inertial frames — observers who are not accelerating. It does
              <em> not</em> describe gravity, accelerating observers, or curved spacetime. Those require
              general relativity (1915), which uses the same mathematical apparatus (Lorentz transformations,
              four-vectors, invariant intervals) but applied to curved spacetime instead of flat.
            </p>
            <p>
              In modern physics, "special relativity" usually means the flat-spacetime mathematics that
              every charged particle, every electromagnetic wave, every relativistic quantum field theory
              uses. It's not an exotic regime; it's the framework underneath ordinary electrodynamics
              and the Standard Model of particle physics.
            </p>
          </Section>
        </div>
      )}

      {tab === 'lorentz' && (
        <div className="fade-in">
          <Section title="The Lorentz factor">
            <p>
              Define β = v/c (the velocity in units of c) and the Lorentz factor γ:
            </p>
            <Eq>γ = 1 / √(1 − β²) = 1 / √(1 − v²/c²)</Eq>
            <p>
              γ governs every relativistic effect. At low speeds (β ≪ 1), γ ≈ 1 + ½β² ≈ 1 — nothing
              relativistic happens. As β approaches 1, γ blows up to infinity. Crossing β = 0.866 puts γ at 2;
              β = 0.99 puts γ at 7.1; β = 0.999 puts γ at 22.4.
            </p>
          </Section>

          <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT}30`, background: 'rgba(255, 201, 122, 0.04)' }}>
            <div className="flex items-center gap-3 mb-4"><Pill>interactive</Pill></div>
            <h4 className="font-display text-xl mb-2" style={{ letterSpacing: '-0.01em' }}>The Lorentz factor in action</h4>
            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-display text-sm" style={{ color: INK }}>Velocity v / c (β)</span>
                <span className="font-mono text-sm" style={{ color: ACCENT }}>{v.toFixed(4)}</span>
              </div>
              <input type="range" min="0" max="0.9999" step="0.0001" value={v}
                     onChange={e => setV(parseFloat(e.target.value))} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: BORDER }}>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Lorentz factor γ</div>
                <div className="font-mono text-2xl" style={{ color: ACCENT, letterSpacing: '-0.02em' }}>{gamma.toFixed(3)}</div>
              </div>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Time dilation</div>
                <div className="font-mono text-base" style={{ color: INK }}>1 s → {gamma.toFixed(3)} s</div>
              </div>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Length contraction</div>
                <div className="font-mono text-base" style={{ color: INK }}>1 m → {(1/gamma).toFixed(3)} m</div>
              </div>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Relativistic mass × m₀</div>
                <div className="font-mono text-base" style={{ color: INK }}>{gamma.toFixed(3)}×</div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 md:grid-cols-6 gap-px" style={{ background: BORDER }}>
              {[0.1, 0.5, 0.866, 0.95, 0.99, 0.999].map(b => (
                <button key={b} onClick={() => setV(b)}
                        className="p-3 text-center transition hover:bg-white/5"
                        style={{ background: BG }}>
                  <div className="font-mono text-xs" style={{ color: ACCENT }}>v = {b}c</div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: DIM }}>γ ≈ {(1/Math.sqrt(1-b*b)).toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          <Section title="The structure of the Lorentz factor">
            <p>
              Why this particular form? It comes from demanding that intervals
              s² = c²t² − x² are invariant under coordinate change. Under a velocity boost in the x
              direction, time and space coordinates mix:
            </p>
            <Eq>t′ = γ(t − vx/c²),    x′ = γ(x − vt),    y′ = y,    z′ = z</Eq>
            <p>
              These are the <em>Lorentz transformations</em>. The factor γ ensures that c stays
              invariant: a light pulse with x = ct in one frame still has x′ = ct′ in another. Notice
              that time and space don't transform independently — they mix. Two events simultaneous
              in one frame (different x, same t) are not simultaneous in another (different t′).
            </p>
          </Section>

          <Section title="Spacetime intervals">
            <p>
              The invariant quantity in Lorentz transformations is the spacetime interval:
            </p>
            <Eq>Δs² = c² Δt² − Δx² − Δy² − Δz²</Eq>
            <p>
              All observers, no matter how they move, agree on Δs² between two events. They disagree on
              Δt and Δx individually, but the combination is the same. This is the most important
              invariant in special relativity — analogous to how rotations preserve length in 3D but
              not individual coordinates.
            </p>
            <p>
              When Δs² {'>'} 0, the events are time-like separated (one can causally affect the other).
              When Δs² {'<'} 0, they are space-like separated (causally disconnected; some observers see
              event A first, others see B first). When Δs² = 0, they're light-like (connectable by a light
              ray). This division — the "light cone" structure of spacetime — is the deepest geometric
              fact in SR.
            </p>
          </Section>
        </div>
      )}

      {tab === 'phenomena' && (
        <div className="fade-in">
          <Section title="Time dilation">
            <p>
              A clock moving with velocity v relative to you ticks slowly. Its proper time τ (measured by
              an observer travelling with the clock) relates to your time t by:
            </p>
            <Eq>Δt = γ Δτ</Eq>
            <p>
              At v = 0.99c, γ ≈ 7.1. A traveller's wristwatch advances 1 hour while you measure 7.1 hours
              elapsed. This is not an illusion — every physical process slows: heartbeats, chemical
              reactions, radioactive decays, the cesium clock. It's measured every day at particle
              accelerators where unstable particles' lifetimes are stretched exactly as predicted.
            </p>
            <p>
              The most everyday example: GPS satellites move at ~14,000 km/h relative to ground, which
              would cause their clocks to fall behind ground clocks by ~7 μs per day from special
              relativity alone. (GR effects from being higher in Earth's gravity cause an opposing ~45 μs
              advance per day.) GPS positioning would drift kilometers per day without both corrections.
            </p>
          </Section>

          <Section title="Length contraction">
            <p>
              An object's length L₀ in its rest frame is its <em>proper length</em>. Measured from a
              frame in which it moves at speed v, the length along the direction of motion is:
            </p>
            <Eq>L = L₀ / γ</Eq>
            <p>
              A spacecraft 100 m long in its own frame, flying past you at 0.866c, measures 50 m long
              to you. Transverse dimensions don't change — only lengths along the direction of motion.
            </p>
            <p>
              Important: this is a direct, measurable consequence of how we synchronise clocks. You
              measure a moving object's "length" by recording its endpoint positions simultaneously
              <em> in your frame</em>. Because simultaneity is observer-dependent, what you record is
              shorter than what the object's owner records.
            </p>
          </Section>

          <Section title="Relativistic mass and energy">
            <p>
              Momentum and energy of a particle with rest mass m₀ moving at velocity v:
            </p>
            <Eq>p = γ m₀ v,    E = γ m₀ c²,    E² = (pc)² + (m₀c²)²</Eq>
            <p>
              Setting v = 0 gives <Term k="binding energy">E = m₀c²</Term> — the rest energy. Even a
              stationary particle carries enormous energy equivalent to its mass. A 1 kg object has
              ~9 × 10¹⁶ J of rest energy, equivalent to ~21 megatonnes of TNT. (This is why fission
              and fusion are so energetic: a tiny fraction of rest mass is released as kinetic energy.)
            </p>
            <p>
              Setting m₀ = 0 gives E = pc — light. Photons have zero rest mass but non-zero energy and
              momentum. The combination E² − (pc)² = (m₀c²)² is the invariant rest energy — agreed on
              by all observers, just like spacetime intervals.
            </p>
            <p>
              The often-quoted "mass increases with velocity" is misleading modern usage. Modern
              convention: rest mass m₀ is intrinsic; γm₀ is just energy/c² and isn't a separate "mass."
              But operationally, accelerating a particle to higher velocity requires more force per
              unit velocity gained — exactly as if its inertia had grown by factor γ.
            </p>
          </Section>

          <Section title="The cosmic speed limit">
            <p>
              No object with non-zero rest mass can reach v = c. As v → c, the required energy goes to
              infinity (because γ → ∞). This is one of the most experimentally probed facts in physics:
              the LHC accelerates protons to v = 0.999999991c — extraordinarily close to but never at c.
            </p>
            <p>
              Photons and gluons travel at exactly c — they have zero rest mass and the energy/momentum
              equation E = pc holds. Gravitational waves also travel at c (confirmed by GW170817:
              gravitational and EM signals from a neutron-star merger arrived within ~1.7 seconds of
              each other after 130 million years of travel — a constraint on speed difference of ~10⁻¹⁵).
            </p>
          </Section>
        </div>
      )}

      {tab === 'paradoxes' && (
        <div className="fade-in">
          <Section title="The twin paradox">
            <p>
              Twin A stays on Earth. Twin B flies to a distant star at high speed, turns around, comes
              back. Each one sees the other's clocks running slow due to time dilation — so who is
              actually younger when they reunite?
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Resolution:</strong> the situation is not symmetric.
              Twin A stays in one inertial frame the entire time. Twin B accelerates (during launch,
              turnaround, landing). It's the turnaround — the only moment of non-inertial motion — that
              breaks the symmetry. When they meet again, twin B has aged less by a factor γ relative to
              twin A.
            </p>
            <p>
              For B travelling at 0.99c to a star 10 light-years away: A measures the trip as ~20 years.
              B, with γ ≈ 7.1, ages ~2.8 years. They meet again with A 17 years older than B.
              Confirmed via cosmic-ray muon experiments and atomic-clock-on-airplane experiments — at
              tiny but measurable scales.
            </p>
          </Section>

          <Section title="The ladder paradox (and resolution)">
            <p>
              A 10-m ladder runs at 0.866c (γ = 2) toward a 5-m garage. From the garage frame, the
              ladder length-contracts to 5 m and briefly fits inside. From the ladder's frame, it's the
              garage that's contracted (to 2.5 m), so the ladder cannot fit.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Resolution:</strong> simultaneity is relative. In the
              garage frame, the front of the ladder exiting the back wall and the rear of the ladder
              entering the front are simultaneous. In the ladder's frame, they are not — the front
              exits first, then later the rear enters. There's never a moment when the ladder is
              actually contained from the ladder's own perspective; the events that "fit" in the garage
              frame are not the same events from the ladder frame.
            </p>
            <p>
              The lesson: relativity allows different frames to disagree about simultaneity, ordering of
              spatially-separated events, lengths, and durations. What everyone must agree on is the
              invariant spacetime interval and the causal structure (light cones).
            </p>
          </Section>

          <Section title="Experimental tests">
            <p>
              SR is one of the most thoroughly tested theories in physics. A partial list of confirmations:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Muon lifetimes</strong> — Cosmic-ray muons created in the
              upper atmosphere should decay (lifetime 2.2 μs at rest) before reaching the ground.
              Relativistic time dilation extends their observed lifetime by factor γ ≈ 10–30. The flux
              reaching ground level matches SR predictions exactly.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Particle accelerators</strong> — Every modern accelerator
              relies on SR to predict particle behaviour. The LHC, Fermilab, etc., would all fail
              spectacularly if SR were even slightly wrong.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Atomic clock experiments</strong> — Hafele-Keating (1971)
              flew atomic clocks around the world east- and west-bound and measured the predicted
              time dilation to within experimental precision. Subsequent experiments using satellites
              and centrifuges confirm to 10⁻⁹ precision.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>GW170817</strong> — Gravitational waves and gamma rays
              from a neutron-star merger arrived within 1.74 seconds of each other after travelling
              ~130 Mly. Both at c to within ~10⁻¹⁵.
            </p>
          </Section>
        </div>
      )}

      <WorkedExample title="How far is Andromeda in the traveller's frame?"
                     steps={[
                       { text: 'Andromeda is 2.5 Mly away. Suppose you fly there at v = 0.999c. In Earth\'s frame, the trip takes how long?',
                         eq: 't_Earth = 2.5e6 / 0.999 ≈ 2.5 × 10⁶ years' },
                       { text: 'Compute γ at v = 0.999c.',
                         eq: 'γ = 1 / √(1 − 0.999²) ≈ 22.4' },
                       { text: 'Length contraction: in YOUR frame (the traveller\'s), the distance to Andromeda contracts:',
                         eq: 'L = L₀ / γ = 2.5 Mly / 22.4 ≈ 112,000 ly' },
                       { text: 'You traverse 112,000 light-years at v = 0.999c, so YOU experience:',
                         eq: 't_traveller = 112,000 / 0.999 ≈ 112,000 years',
                         answer: 'Equivalently, Earth\'s 2.5 Myr divided by γ = 22.4 gives ~112,000 years. With γ = 1000 (v = 0.9999995c), the trip would take only ~2,500 years of your time. The galaxy is in principle traversable in a single human lifetime — at sufficient γ. The problem is the energy to reach such speeds: γ × rest energy of even a small spacecraft exceeds anything humans have ever produced.' },
                     ]} />

      <Quiz questions={[
        { q: 'A particle with rest mass m₀ moves at v = 0.6c. Its total energy in your frame is:',
          options: ['m₀c²', '0.6 m₀c²', '1.25 m₀c²', '0.8 m₀c²'],
          correct: 2,
          explain: 'γ = 1/√(1 − 0.36) = 1/√0.64 = 1.25. Total energy E = γm₀c² = 1.25 m₀c². Of that, m₀c² is rest energy and 0.25 m₀c² is kinetic energy.' },
        { q: 'Two events happen at the same time but in different places, in frame A. In a different frame B moving relative to A, the events:',
          options: ['Are still simultaneous', 'May happen in either order, depending on B\'s velocity direction', 'Become impossible to distinguish', 'Always happen in the same order regardless of B'],
          correct: 1,
          explain: 'This is the relativity of simultaneity. From the Lorentz transformation Δt\' = γ(Δt − v Δx/c²), if Δt = 0 (simultaneous in A) but Δx ≠ 0 (different places), then Δt\' = −γ v Δx/c² — non-zero. Different B observers see different orderings. Causality is preserved only for time-like separated events (where Δs² > 0).' },
        { q: 'A muon at rest has lifetime 2.2 μs. A muon created in the upper atmosphere with γ = 30 lives, as measured from the ground, for:',
          options: ['2.2 μs', '73 ns', '66 μs', '660 μs'],
          correct: 2,
          explain: 'Time dilation: observed lifetime = γ × proper lifetime = 30 × 2.2 μs = 66 μs. That\'s long enough for a muon travelling near c to cover ~20 km — i.e., to reach the ground from where they\'re typically created. Without SR, essentially no muons would arrive at Earth\'s surface. The observed muon flux confirms time dilation directly.' },
      ]} />

      <OpenQuestions items={[
        { q: 'Is the speed of light a fundamental constant or could it vary?',
          detail: '— Many variants of "varying speed of light" theories have been proposed (Moffat, Albrecht-Magueijo). Experimentally, c is constant to better than 10⁻¹⁷ over the age of the universe. But whether c is truly a fundamental constant or a derived quantity in some deeper theory (e.g. emerging from spacetime structure) remains a question for quantum gravity.' },
        { q: 'Does Lorentz invariance hold at all scales?',
          detail: '— Some quantum gravity proposals (loop quantum gravity, doubly special relativity) suggest small Lorentz invariance violations at the Planck scale. Experimental searches via gamma-ray bursts, high-energy cosmic rays, and astrophysical neutrinos have placed extraordinarily tight bounds (≤10⁻²⁰ relative deviations at TeV energies). No violations have been found.' },
        { q: 'How fast can information actually travel?',
          detail: '— No signal carrying information can exceed c. But quantum entanglement appears to involve "instant" correlation at arbitrary distances, leading to apparent paradoxes (EPR). The standard resolution: correlations are not signals — you can\'t use entanglement to send information. The "no-communication theorem" formally proves this. Quantum mechanics is fully compatible with relativity at the signal level.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  14 · THE COSMIC MICROWAVE BACKGROUND
// ═══════════════════════════════════════════════════════════════════════════

function CMB({ onBack }) {
  const [tab, setTab] = useState('spectrum');
  const [T, setT] = useState(2.725); // CMB temperature in K

  return (
    <PageShell onBack={onBack} eyebrow="15 — Relic Radiation"
               title={<>The <em style={{ color: ACCENT, fontStyle: 'italic' }}>Cosmic Microwave Background</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Every direction you point a sensitive radio antenna, you receive a faint hum at ~2.725 K. It is
        the universe's oldest light, released 380,000 years after the Big Bang. Its spectrum is the
        most perfect blackbody ever measured. Its tiny temperature variations — one part in 100,000 —
        encode the entire history of cosmic structure.
      </p>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-px mb-6" style={{ background: BORDER }}>
        {[
          ['spectrum', 'The Spectrum'],
          ['origin', 'Origin · Recombination'],
          ['anisotropies', 'The Anisotropies'],
          ['cosmology', 'What It Tells Us'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
                  className="p-4 text-center transition"
                  style={{ background: tab === id ? `${ACCENT}15` : BG,
                           borderTop: tab === id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-sm md:text-base" style={{ color: tab === id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{label}</div>
          </button>
        ))}
      </div>

      {tab === 'spectrum' && (
        <div className="fade-in">
          <Section title="The most perfect blackbody known">
            <p>
              The CMB has the spectrum of an ideal thermal blackbody at T = 2.7255 ± 0.0006 K. This was
              measured to extraordinary precision by the FIRAS instrument on the COBE satellite in 1989.
              The fit is so perfect that the experimental error bars are smaller than the line width on
              any published plot.
            </p>
            <p>
              Why does this matter so much? A perfect blackbody is what you get from matter and radiation
              in complete thermal equilibrium. Any departure from a Planck curve would indicate an
              additional energy injection (decaying particles, residual interactions, exotic physics)
              that disturbed equilibrium. The CMB's perfection puts extraordinarily strong constraints
              on any such process: less than ~10⁻⁵ of the total energy density can be in any non-thermal
              component since recombination.
            </p>
          </Section>

          <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT}30`, background: 'rgba(255, 201, 122, 0.04)' }}>
            <div className="flex items-center gap-3 mb-4"><Pill>interactive</Pill></div>
            <h4 className="font-display text-xl mb-4" style={{ letterSpacing: '-0.01em' }}>The CMB through cosmic history</h4>
            <p className="font-display text-sm leading-relaxed mb-6" style={{ color: '#c8c3b1' }}>
              The CMB temperature scales as T = 2.725 × (1 + z) K, where z is the redshift of the era you
              observe it from. Higher z = earlier and hotter universe.
            </p>

            <div className="mb-6">
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-display text-sm" style={{ color: INK }}>CMB temperature</span>
                <span className="font-mono text-sm" style={{ color: ACCENT }}>{T < 100 ? T.toFixed(3) : T.toFixed(0)} K</span>
              </div>
              <input type="range" min="0.435" max="3.5" step="0.01"
                     value={Math.log10(T)}
                     onChange={e => setT(Math.pow(10, parseFloat(e.target.value)))} className="w-full" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: BORDER }}>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Redshift z</div>
                <div className="font-mono text-base" style={{ color: INK }}>{(T / 2.725 - 1).toFixed(2)}</div>
              </div>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Peak wavelength (Wien)</div>
                <div className="font-mono text-base" style={{ color: INK }}>{(2.898e-3 / T * 1e3).toPrecision(3)} mm</div>
              </div>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Spectral regime</div>
                <div className="font-mono text-base" style={{ color: INK }}>
                  {T < 30 ? 'Microwave' : T < 3000 ? 'Far-IR' : T < 10000 ? 'Visible' : 'UV/X-ray'}
                </div>
              </div>
              <div className="p-4" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: DIM }}>Cosmic era</div>
                <div className="font-display text-sm" style={{ color: INK }}>
                  {T < 3 ? 'Today' : T < 10 ? 'Galaxy formation' : T < 100 ? 'Dark ages' : T < 3000 ? 'Reionisation→present' : T < 10000 ? 'Recombination' : 'Pre-recombination'}
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-px" style={{ background: BORDER }}>
              {[
                { T: 2.725, z: 0, label: 'Today' },
                { T: 27.25, z: 9, label: 'First galaxies' },
                { T: 273.15, z: 99, label: 'Earth-temp era' },
                { T: 3000, z: 1099, label: 'Recombination' },
                { T: 10000, z: 3669, label: 'Pre-recomb plasma' },
              ].map(p => (
                <button key={p.label} onClick={() => setT(p.T)}
                        className="p-3 text-center transition hover:bg-white/5"
                        style={{ background: BG }}>
                  <div className="font-mono text-xs" style={{ color: ACCENT }}>{p.label}</div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: DIM }}>T = {p.T} K, z = {p.z}</div>
                </button>
              ))}
            </div>
          </div>

          <Section title="Why the CMB peaks in microwaves now">
            <p>
              At recombination (z ≈ 1100), the universe was filled with radiation at ~3000 K — the peak
              wavelength of that blackbody was ~1000 nm, near-infrared. As the universe expanded by a
              factor of ~1100, all those wavelengths stretched by the same factor. 1000 nm × 1100 = 1.1 mm,
              squarely in the microwave band. This isn't an accident — it's a direct consequence of cosmic
              expansion preserving photon-number while increasing wavelength.
            </p>
            <Eq>T_CMB(z) = T_today × (1 + z) = 2.725 K × (1 + z)</Eq>
            <p>
              The CMB photon number density today is ~411 photons/cm³. There are roughly 2 × 10⁹ CMB
              photons for every baryon in the universe. By number, the universe is overwhelmingly photons.
              By energy density, however, matter has dominated since z ≈ 3400, and dark energy since
              z ≈ 0.4.
            </p>
          </Section>
        </div>
      )}

      {tab === 'origin' && (
        <div className="fade-in">
          <Section title="Before recombination: an opaque plasma">
            <p>
              In the first ~380,000 years after the Big Bang, the universe was so hot that hydrogen
              atoms couldn't form. Every electron knocked into a nucleus was immediately ionised by
              high-energy photons. The universe was a soup of free electrons, protons, helium nuclei,
              and photons, all colliding constantly.
            </p>
            <p>
              For a photon, this plasma was opaque. The mean free path between scattering events
              (off free electrons via Thomson scattering) was minuscule — photons couldn't propagate. The
              universe was effectively a glowing fog.
            </p>
          </Section>

          <Section title="The transition: recombination">
            <p>
              As the universe expanded and cooled to ~3000 K (at z ≈ 1100, ~380,000 years after the
              Big Bang), the photon energies dropped below hydrogen's binding energy of 13.6 eV. Electrons
              could now bind to nuclei without being immediately knocked off. The plasma rapidly recombined
              into neutral atoms.
            </p>
            <p>
              The key consequence: Thomson scattering requires free electrons. Once they're bound in atoms,
              the photon mean free path balloons by orders of magnitude. The universe became transparent
              within a few thousand years. Photons that had been bouncing around in the plasma began
              streaming freely — and have been streaming, with no further scattering, for the 13.8
              billion years since.
            </p>
            <p>
              The name "recombination" is a misnomer — the electrons and nuclei had never been "combined"
              before. The term was coined by spectroscopists studying gas discharges, where electrons
              actually do re-combine repeatedly. The astronomical usage stuck.
            </p>
          </Section>

          <Section title="The surface of last scattering">
            <p>
              When we observe the CMB, we are looking at the moment of last scattering — the last time
              those photons interacted with matter. This surface is essentially spherical (we see it in
              all directions) and at a distance of ~14 Gpc (the comoving distance to z = 1100).
            </p>
            <p>
              "Last scattering" wasn't instantaneous — it took ~100,000 years for the universe to fully
              transition. The CMB we observe is effectively an average over this thickness. The finite
              width imposes a small smoothing on small angular scales but doesn't fundamentally limit the
              information we extract.
            </p>
            <p>
              Recombination is one of cosmology's most precise epochs. The Saha equation for hydrogen
              ionisation, combined with cooling cosmic expansion, predicts the exact temperature and
              redshift to within fractions of a percent. CMB observations confirm these predictions.
            </p>
          </Section>

          <Section title="Discovery">
            <p>
              In 1965, Arno Penzias and Robert Wilson at Bell Labs were testing a sensitive radio antenna
              and found a persistent ~3 K signal that didn't go away no matter where they pointed.
              Initially baffled (they spent months cleaning out pigeon droppings, suspecting that was the
              source), they learned from a colleague that Dicke and Peebles at Princeton had just predicted
              such a signal as a relic of the Big Bang.
            </p>
            <p>
              Penzias and Wilson won the 1978 Nobel Prize for the accidental discovery. The CMB is one of
              the three pillars of Big Bang cosmology (along with the abundance of light elements from
              BBN and the redshift-distance relation from Hubble expansion). It established the hot Big
              Bang as the correct cosmological model and effectively ended the steady-state theory.
            </p>
          </Section>
        </div>
      )}

      {tab === 'anisotropies' && (
        <div className="fade-in">
          <Section title="The CMB is not perfectly uniform">
            <p>
              Initial observations of the CMB suggested perfect uniformity in all directions — to within
              measurement precision. As detectors improved, structure emerged at progressively smaller
              levels:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>~10⁻³ (10⁻³ K):</strong> the dipole. The CMB is ~3.4 mK
              warmer in one direction (toward Leo) and ~3.4 mK cooler in the opposite. This is our motion
              through the CMB rest frame — the Sun moves at ~370 km/s. The Local Group as a whole moves
              at ~620 km/s, probably toward the Great Attractor and Shapley supercluster.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>~10⁻⁵ (~30 μK):</strong> intrinsic anisotropies. Tiny
              temperature variations from one patch of sky to another, present at the surface of last
              scattering, frozen in by free-streaming since. These were first detected by COBE in 1992
              (Smoot and Mather, 2006 Nobel).
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Polarisation:</strong> ~10⁻⁶ in linear polarisation,
              from Thomson scattering at last scattering. E-modes (curl-free) detected confidently; B-modes
              (divergence-free, potentially from inflationary gravitational waves) much harder, still
              undetected at the inflationary level.
            </p>
          </Section>

          <Section title="The acoustic peaks">
            <p>
              The most famous structure in the CMB is the angular power spectrum — temperature variance
              as a function of angular scale. It shows a series of peaks: the first at ~1° angular
              separation, then progressively smaller. These are the imprint of <em>acoustic oscillations</em>
              in the pre-recombination plasma.
            </p>
            <p>
              Density fluctuations in the photon-baryon fluid oscillated like sound waves. The wavelength
              of the strongest oscillation at recombination — when sound froze in — sets the angular scale
              of the first peak: about 1°. The harmonics of that fundamental show up as subsequent peaks
              at smaller angular scales.
            </p>
            <p>
              The exact pattern is exquisitely sensitive to cosmological parameters:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Peak positions</strong> tell us the geometry of space (the universe is flat to ~0.4%)<br />
              <strong style={{ color: ACCENT }}>Relative heights</strong> tell us the ratio of baryons to dark matter (~1:5)<br />
              <strong style={{ color: ACCENT }}>Damping tail</strong> tells us the number of relativistic species (neutrinos)<br />
              <strong style={{ color: ACCENT }}>Polarisation cross-spectrum</strong> tells us about reionisation, gravitational lensing, primordial gravitational waves
            </p>
          </Section>

          <Section title="The Planck satellite measurement">
            <p>
              ESA's Planck satellite (2009–2013) measured the CMB anisotropy power spectrum across nine
              frequency bands with unprecedented precision. Its 2018 final analysis yielded:
            </p>
            <p>
              H₀ = 67.4 ± 0.5 km/s/Mpc<br />
              Ω_m (matter density) = 0.315 ± 0.007<br />
              Ω_Λ (dark energy density) = 0.685 ± 0.007<br />
              Ω_b (baryon density) = 0.0493 ± 0.0006<br />
              Age of universe = 13.797 ± 0.023 Gyr<br />
              Universe is flat to ±0.4%
            </p>
            <p>
              The H₀ value from Planck differs from local distance-ladder measurements (~73 km/s/Mpc) by
              ~5σ — the so-called Hubble tension. Either there's an unidentified systematic in one of
              the measurements, or the standard ΛCDM cosmological model is incomplete.
            </p>
          </Section>
        </div>
      )}

      {tab === 'cosmology' && (
        <div className="fade-in">
          <Section title="The universe is flat">
            <p>
              The first acoustic peak in the CMB spectrum sits at angular scale ℓ ≈ 220, corresponding
              to ~1° on the sky. In a closed universe, this peak would shift to larger angles (larger ℓ
              values); in an open universe, smaller angles. The observed position matches a flat universe
              to within 0.4%.
            </p>
            <p>
              This was one of the great pre-Planck predictions of inflation: inflation should drive the
              universe arbitrarily close to flat. CMB confirms it. The total energy density is, to high
              precision, exactly the critical density needed to make spatial geometry Euclidean on cosmic
              scales.
            </p>
          </Section>

          <Section title="The composition of the universe">
            <p>
              The acoustic peak heights give the ratio of baryons to dark matter to radiation. The
              modern values, from CMB combined with BBN and large-scale structure:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Ordinary matter (baryons):</strong> ~5%. Atoms, stars, planets, you.<br />
              <strong style={{ color: ACCENT }}>Dark matter:</strong> ~27%. Gravitating but invisible. Particle nature unknown.<br />
              <strong style={{ color: ACCENT }}>Dark energy:</strong> ~68%. Causing accelerating expansion. Nature unknown.<br />
              <strong style={{ color: ACCENT }}>Photons + neutrinos:</strong> ~0.01% today (was dominant until z ≈ 3400)
            </p>
            <p>
              The fact that we know these numbers to ~1% — for components we don't yet understand the
              fundamental nature of — is one of the most striking achievements of late-20th-century physics.
            </p>
          </Section>

          <Section title="Reionisation signature">
            <p>
              When the first stars and galaxies turned on (~150 Myr to ~1 Gyr after the Big Bang), their
              UV light reionised the universe again. CMB photons travelling through this reionised plasma
              scattered off free electrons — leaving a polarisation signature at large angular scales.
            </p>
            <p>
              This signature gives an "optical depth to reionisation" τ ≈ 0.054. Combined with theory, that
              implies reionisation completed around z ≈ 7, ~770 Myr after the Big Bang. JWST is now imaging
              galaxies from this era and trying to determine if they produced enough UV to do the job.
            </p>
          </Section>

          <Section title="Gravitational lensing of the CMB">
            <p>
              CMB photons travel through 13.8 Gyr of cosmic structure. They are gravitationally deflected
              by dark matter halos along the way, smearing and re-arranging the temperature pattern slightly.
              This lensing has been detected by Planck, ACT, and SPT and provides an independent map of
              the dark matter distribution out to high redshift.
            </p>
            <p>
              The lensing also constrains the sum of neutrino masses (~Σm_ν {'<'} 0.12 eV from current data),
              the dark-energy equation of state, and parameters of inflation.
            </p>
          </Section>

          <Section title="Open: primordial B-modes">
            <p>
              Inflation predicts that quantum fluctuations of spacetime during the inflationary epoch should
              imprint a faint pattern of "B-mode" polarisation on the CMB. B-modes have a curl-like pattern
              (unlike E-modes from density fluctuations, which are gradient-like). Detecting primordial B-modes
              would be a smoking gun for inflation — and would let us measure the energy scale at which
              inflation occurred.
            </p>
            <p>
              No detection yet. Upper limits from BICEP/Keck place the tensor-to-scalar ratio r {'<'} 0.036.
              Future experiments (CMB-S4, LiteBIRD, Simons Observatory) aim for r ≈ 0.001, which would
              probe inflation at the GUT scale ~10¹⁶ GeV. A detection would be one of the most important
              measurements of the 21st century.
            </p>
          </Section>
        </div>
      )}

      <WorkedExample title="What angular scale is the first acoustic peak?"
                     steps={[
                       { text: 'At recombination, sound waves in the photon-baryon plasma had been oscillating for ~380,000 years. The sound speed in this plasma is c_s ≈ c/√3.',
                         eq: 'sound horizon at recombination: r_s = c_s × t_rec ≈ (c/√3) × 380,000 yr × (cosmic expansion factor)' },
                       { text: 'After accounting for cosmic expansion during this time, the comoving sound horizon comes out to about 150 Mpc.',
                         eq: 'r_s ≈ 150 Mpc (comoving)' },
                       { text: 'This 150 Mpc scale is observed today at angular size:',
                         eq: 'θ ≈ r_s / D_A ≈ 150 Mpc / 14,000 Mpc ≈ 0.011 rad ≈ 0.6°' },
                       { text: 'Translating to angular wavenumber ℓ ≈ π/θ:',
                         eq: 'ℓ_peak ≈ π / 0.011 ≈ 280',
                         answer: 'The first acoustic peak should appear at multipole ℓ ≈ 220–280, corresponding to about 0.7–1° on the sky. Observationally Planck finds the peak at ℓ = 220.0 ± 0.5 — matching the prediction beautifully. The agreement gives us our most precise measurement of the universe\'s spatial flatness.' },
                     ]} />

      <Quiz questions={[
        { q: 'The CMB photons that arrive at Earth today were emitted from:',
          options: ['Stars in distant galaxies', 'The surface of last scattering at z ≈ 1100', 'The first galaxies at z ≈ 10', 'Hot intergalactic gas'],
          correct: 1,
          explain: 'The CMB is photons released ~380,000 years after the Big Bang at z ≈ 1100, when the universe transitioned from opaque plasma to transparent neutral gas. They\'ve been streaming freely ever since — for ~13.8 Gyr.' },
        { q: 'Why does the CMB show such tiny temperature variations (~10⁻⁵) across the sky?',
          options: ['Measurement noise', 'Quantum fluctuations imprinted on the plasma at recombination', 'Doppler effects from galaxy motion', 'Stars between us and the CMB'],
          correct: 1,
          explain: 'The 10⁻⁵ variations are real density perturbations in the photon-baryon plasma at the moment of recombination. They originated as quantum vacuum fluctuations during inflation, stretched to macroscopic size by exponential expansion. These same fluctuations seeded all subsequent structure — galaxies, clusters, you.' },
        { q: 'Planck satellite gives H₀ = 67.4 km/s/Mpc. Cepheid+SN distance ladder gives H₀ ≈ 73 km/s/Mpc. This 5σ disagreement is called:',
          options: ['The flatness problem', 'The Hubble tension', 'The CMB problem', 'The dark energy crisis'],
          correct: 1,
          explain: 'The "Hubble tension" — currently one of the most important problems in cosmology. Either there\'s an undetected systematic in one of the measurements, or our cosmological model needs new physics: early dark energy, modified neutrino interactions, or deviations from ΛCDM at recombination.' },
      ]} />

      <OpenQuestions items={[
        { q: 'Is the Hubble tension real, and if so what does it mean?',
          detail: '— A decade of work has not narrowed the ~5σ Planck/distance-ladder disagreement. Either systematic errors in one or both measurements, or new physics. Candidate explanations: early dark energy, additional neutrino species, modified gravity at recombination — all introduce other problems and none is universally accepted.' },
        { q: 'Can we detect primordial gravitational waves in CMB B-modes?',
          detail: '— A confirmed detection would establish inflation as essentially fact and measure the energy scale at which it happened. The 2014 BICEP2 claim turned out to be galactic dust. Current limits r < 0.036 are very tight. Future missions (LiteBIRD, CMB-S4) target r ≈ 0.001 — small enough to detect (or rule out) the simplest inflation models.' },
        { q: 'What does the CMB tell us about the nature of dark matter?',
          detail: '— The CMB confirms dark matter exists and quantifies its abundance (~27% of cosmic energy density). It constrains the relative populations of cold/warm/hot dark matter. But it does not (yet) point to what particle dark matter is. WIMPs, axions, primordial black holes, sterile neutrinos all remain candidates.' },
        { q: 'Are there anomalies in the CMB we should take seriously?',
          detail: '— Several mild anomalies (the "axis of evil", the cold spot in Eridanus, hemispherical power asymmetry) appear in the data at 2-3σ level. These could be cosmic variance (we only have one universe to observe), residual foregrounds, or genuine new physics. They\'ve been persistent through Planck and have prompted serious theoretical attention but no consensus interpretation.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  15 · ORBITS & GRAVITY · Falling Sideways Forever
// ═══════════════════════════════════════════════════════════════════════════

// SVG component: an interactive orbit visualisation
function OrbitDiagram({ e, a = 100, showFoci = true, showAxes = true, size = 360, animate = true }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!animate) return;
    const id = setInterval(() => setT(prev => (prev + 0.015) % (2 * Math.PI)), 30);
    return () => clearInterval(id);
  }, [animate]);

  const cx = size / 2;
  const cy = size / 2;
  const b = a * Math.sqrt(1 - e * e);
  const c = a * e; // focal distance from centre

  // Solve Kepler's equation for current position (true anomaly)
  // Mean anomaly M = t (we're parameterising by time directly here)
  let E = t; // eccentric anomaly estimate
  for (let i = 0; i < 5; i++) E = E - (E - e * Math.sin(E) - t) / (1 - e * Math.cos(E));
  const x = a * (Math.cos(E) - e); // relative to focus
  const y = b * Math.sin(E);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" style={{ background: '#06070d' }}>
      {/* Background stars */}
      {Array.from({ length: 40 }).map((_, i) => {
        const sx = ((i * 37) % 100) / 100 * size;
        const sy = ((i * 53) % 100) / 100 * size;
        return <circle key={i} cx={sx} cy={sy} r={0.5} fill="#fff" opacity={0.3} />;
      })}

      {/* Orbit ellipse — centred at (cx-c, cy) so right focus is at (cx, cy) */}
      <ellipse cx={cx - c} cy={cy} rx={a} ry={b}
               stroke={ACCENT} strokeWidth="1" fill="none" opacity="0.6" />

      {/* Axes */}
      {showAxes && (
        <>
          <line x1={cx - c - a} y1={cy} x2={cx - c + a} y2={cy} stroke={BORDER_STRONG} strokeWidth="0.4" strokeDasharray="2,3" />
          <line x1={cx - c} y1={cy - b} x2={cx - c} y2={cy + b} stroke={BORDER_STRONG} strokeWidth="0.4" strokeDasharray="2,3" />
        </>
      )}

      {/* Primary (Sun) at right focus */}
      <circle cx={cx} cy={cy} r={6} fill={ACCENT} />
      <circle cx={cx} cy={cy} r={12} fill={ACCENT} opacity="0.15" />

      {/* Second focus (empty) */}
      {showFoci && e > 0.05 && (
        <circle cx={cx - 2 * c} cy={cy} r={2} fill={DIM} opacity="0.6" />
      )}

      {/* Orbiting body */}
      <circle cx={cx + x} cy={cy - y} r={4} fill={ACCENT2} />
      <circle cx={cx + x} cy={cy - y} r={8} fill={ACCENT2} opacity="0.2" />

      {/* Vector from primary to body */}
      <line x1={cx} y1={cy} x2={cx + x} y2={cy - y} stroke={ACCENT2} strokeWidth="0.6" opacity="0.5" />

      {/* Labels */}
      <text x={cx + 10} y={cy - 8} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={ACCENT}>primary</text>
      {e > 0.1 && (
        <>
          <text x={cx - c + a + 4} y={cy + 3} fontFamily="JetBrains Mono, monospace" fontSize="8" fill={DIM}>aphelion</text>
          <text x={cx - c - a - 48} y={cy + 3} fontFamily="JetBrains Mono, monospace" fontSize="8" fill={DIM}>perihelion</text>
        </>
      )}
    </svg>
  );
}

// SVG: Lagrange points layout
function LagrangeDiagram({ size = 360 }) {
  const cx = size / 2, cy = size / 2;
  const R = size * 0.32;
  const r_small = size * 0.04;

  const earthX = cx + R, earthY = cy;
  const L1x = earthX - r_small * 5, L1y = cy;
  const L2x = earthX + r_small * 5, L2y = cy;
  const L3x = cx - R, L3y = cy;
  const L4x = cx + R * Math.cos(-Math.PI / 3), L4y = cy + R * Math.sin(-Math.PI / 3);
  const L5x = cx + R * Math.cos(Math.PI / 3), L5y = cy + R * Math.sin(Math.PI / 3);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto" style={{ background: '#06070d' }}>
      {/* Background stars */}
      {Array.from({ length: 30 }).map((_, i) => {
        const sx = ((i * 37) % 100) / 100 * size;
        const sy = ((i * 53) % 100) / 100 * size;
        return <circle key={i} cx={sx} cy={sy} r={0.4} fill="#fff" opacity={0.3} />;
      })}

      {/* Earth's orbit around Sun */}
      <circle cx={cx} cy={cy} r={R} stroke={BORDER_STRONG} strokeWidth="0.5" fill="none" opacity="0.5" />

      {/* Sun at centre */}
      <circle cx={cx} cy={cy} r={10} fill={ACCENT} />
      <circle cx={cx} cy={cy} r={20} fill={ACCENT} opacity="0.15" />
      <text x={cx - 6} y={cy + 28} fontFamily="JetBrains Mono, monospace" fontSize="9" fill={ACCENT}>Sun</text>

      {/* Earth */}
      <circle cx={earthX} cy={earthY} r={5} fill="#4d8edc" />
      <text x={earthX - 12} y={earthY + 20} fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#4d8edc">Earth</text>

      {/* Lagrange points */}
      {[
        { x: L1x, y: L1y, label: 'L1', tag: 'unstable', note: 'SOHO, DSCOVR' },
        { x: L2x, y: L2y, label: 'L2', tag: 'unstable', note: 'JWST, Gaia' },
        { x: L3x, y: L3y, label: 'L3', tag: 'unstable', note: 'opposite Earth' },
        { x: L4x, y: L4y, label: 'L4', tag: 'stable', note: 'Trojans' },
        { x: L5x, y: L5y, label: 'L5', tag: 'stable', note: 'Trojans' },
      ].map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill={p.tag === 'stable' ? '#7aff7a' : ACCENT3} />
          <text x={p.x + 8} y={p.y + 3} fontFamily="JetBrains Mono, monospace" fontSize="10" fill={INK}>{p.label}</text>
          <text x={p.x + 8} y={p.y + 14} fontFamily="JetBrains Mono, monospace" fontSize="7" fill={DIM}>{p.note}</text>
        </g>
      ))}

      {/* L4/L5 dashed lines forming equilateral triangle */}
      <line x1={cx} y1={cy} x2={L4x} y2={L4y} stroke={BORDER_STRONG} strokeWidth="0.3" strokeDasharray="2,3" opacity="0.5" />
      <line x1={cx} y1={cy} x2={L5x} y2={L5y} stroke={BORDER_STRONG} strokeWidth="0.3" strokeDasharray="2,3" opacity="0.5" />
      <line x1={earthX} y1={earthY} x2={L4x} y2={L4y} stroke={BORDER_STRONG} strokeWidth="0.3" strokeDasharray="2,3" opacity="0.5" />
      <line x1={earthX} y1={earthY} x2={L5x} y2={L5y} stroke={BORDER_STRONG} strokeWidth="0.3" strokeDasharray="2,3" opacity="0.5" />
    </svg>
  );
}

function Orbits({ onBack }) {
  const [tab, setTab] = useState('intro');
  const [ecc, setEcc] = useState(0.3);

  return (
    <PageShell onBack={onBack} eyebrow="10 — Gravity & Motion"
               title={<>Orbits & <em style={{ color: ACCENT, fontStyle: 'italic' }}>Gravity</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-3" style={{ color: '#c8c3b1' }}>
        An orbit is what happens when you fall and miss the ground. Newton imagined firing a cannonball
        from a tall mountain: shoot it slow, it lands. Shoot it faster, it lands further. Shoot it fast
        enough and the curve of its fall matches the curve of the Earth — and it never lands. That's
        an orbit.
      </p>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        From this simple picture flow Kepler's laws, the shapes of comets' tails, why Hohmann transfers
        exist, why Saturn has rings but no inner moons, why JWST sits at L2, and why spacecraft do
        bizarre loops to reach the outer planets faster than straight lines could.
      </p>

      {/* Tabs */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-px mb-6" style={{ background: BORDER }}>
        {[
          ['intro', 'Foundations'],
          ['kepler', "Kepler's Laws"],
          ['energy', 'Orbital Energy'],
          ['shapes', 'Shapes & Stability'],
          ['hard', 'Lagrange & Roche'],
          ['practical', 'Spacecraft'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
                  className="p-3 md:p-4 text-center transition"
                  style={{ background: tab === id ? `${ACCENT}15` : BG,
                           borderTop: tab === id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-xs md:text-sm" style={{ color: tab === id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{label}</div>
          </button>
        ))}
      </div>

      {tab === 'intro' && (
        <div className="fade-in">
          <Section title="Newton's universal law of gravitation">
            <p>
              Every mass attracts every other mass with a force proportional to the product of their masses
              and inversely proportional to the square of the distance between them:
            </p>
            <Eq>F = G m₁m₂ / r²,    G ≈ 6.674 × 10⁻¹¹ N·m²/kg²</Eq>
            <p>
              Three things to notice. First, gravity is universal — the same equation governs the apple
              falling from the tree, the Moon orbiting Earth, the Sun orbiting the galactic centre, and
              galaxies clustering together on cosmic scales. Second, it's an inverse-<em>square</em> law —
              double the distance and the force drops by four. Third, gravity is incredibly weak compared
              to the other forces. Two protons repel electromagnetically about 10³⁶ times more strongly
              than they attract gravitationally. Only mass piling up over cosmic scales makes gravity
              dominant.
            </p>
          </Section>

          <Section title="Why does gravity make orbits, not falls?">
            <p>
              When you drop a ball, it accelerates straight down and hits the ground. When the Moon
              accelerates "straight down" toward Earth, it also falls — but its sideways velocity is so
              large that as it falls, Earth's surface curves away beneath it just as fast. So it never
              lands. The Moon is perpetually falling toward Earth and perpetually missing it.
            </p>
            <p>
              Newton himself drew this picture: a cannon on a very tall mountain. Fire slowly, the
              ball arcs and lands. Fire faster, it arcs more shallowly and lands further. Fire fast
              enough — about 7.9 km/s near Earth's surface — and the arc matches Earth's curvature.
              The ball "lands" perpetually on the other side of Earth. That's an orbit. Even faster
              and you get an ellipse going out and back. Faster still — 11.2 km/s — and you reach
              escape velocity and never come back.
            </p>
            <p>
              The key insight: orbital motion is a continuous form of free-fall. An astronaut in orbit
              isn't weightless because gravity has switched off — gravity at 400 km altitude is still ~90%
              of its surface value. They're weightless because they and their spacecraft are falling
              together, with no normal force between them and the floor.
            </p>
          </Section>

          <Section title="The inverse-square miracle">
            <p>
              An inverse-square force has one remarkable property: orbits are closed ellipses (and only
              ellipses, parabolas, or hyperbolas — the conic sections). This is not generic. If gravity
              went as 1/r¹·⁹ or 1/r²·¹, orbits would precess rapidly and "ellipses" would slowly rotate,
              tracing out flower-like rosettes that never close.
            </p>
            <p>
              Bertrand's theorem (1873) proves that only two force laws give closed orbits for all bound
              motion: the inverse-square law (gravity, Coulomb) and the linear restoring force F ∝ −r
              (the harmonic oscillator). It's a deep and slightly suspicious fact that the fundamental
              forces of nature gave us inverse-square gravity. Mercury's tiny orbital precession (43"
              per century, beyond what Newtonian gravity predicts) is one of the early hints that
              gravity isn't quite 1/r² — it was the first observational confirmation of general
              relativity.
            </p>
          </Section>
        </div>
      )}

      {tab === 'kepler' && (
        <div className="fade-in">
          <Section title="Kepler's three laws (1609 – 1619)">
            <p>
              Kepler distilled three empirical laws from Tycho Brahe's pre-telescope observations of
              Mars. They turn out to be exact consequences of Newton's gravity 60 years before Newton
              published it. They remain the foundational vocabulary of all orbital mechanics:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>First law (1609).</strong> Planets orbit the Sun in ellipses,
              with the Sun at one focus (not the centre). The other focus is empty.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Second law (1609).</strong> A line joining a planet to the Sun
              sweeps equal areas in equal times. The planet moves faster at perihelion (close approach) and
              slower at aphelion (far swing). This is conservation of angular momentum.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Third law (1619).</strong> The square of an orbital period
              is proportional to the cube of the semi-major axis:
            </p>
            <Eq>P² = (4π²/GM) × a³,    or in solar units: P² (yr) = a³ (AU)</Eq>
            <p>
              Earth: a = 1 AU, P = 1 yr → 1 = 1. Mars: a = 1.52 AU, P = 1.88 yr → 1.88² = 3.53, 1.52³ = 3.51. ✓
            </p>
          </Section>

          <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT}30`, background: 'rgba(255, 201, 122, 0.04)' }}>
            <div className="flex items-center gap-3 mb-4"><Pill>interactive</Pill></div>
            <h4 className="font-display text-xl mb-2" style={{ letterSpacing: '-0.01em' }}>Watch an orbit, vary eccentricity</h4>
            <p className="font-display text-sm leading-relaxed mb-6" style={{ color: DIM }}>
              The dot moves under real gravity — slow at aphelion, fast at perihelion. That's Kepler's
              second law in action. Push the eccentricity up to see it become comet-like.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 items-center">
              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-display text-sm" style={{ color: INK }}>Eccentricity e</span>
                    <span className="font-mono text-sm" style={{ color: ACCENT }}>{ecc.toFixed(3)}</span>
                  </div>
                  <input type="range" min="0" max="0.95" step="0.01" value={ecc}
                         onChange={e => setEcc(parseFloat(e.target.value))} className="w-full" />
                </div>
                <div className="grid grid-cols-2 gap-px mb-3" style={{ background: BORDER }}>
                  <div className="p-3" style={{ background: BG }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Perihelion (a×(1−e))</div>
                    <div className="font-mono text-sm" style={{ color: INK }}>{(1 - ecc).toFixed(3)} a</div>
                  </div>
                  <div className="p-3" style={{ background: BG }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Aphelion (a×(1+e))</div>
                    <div className="font-mono text-sm" style={{ color: INK }}>{(1 + ecc).toFixed(3)} a</div>
                  </div>
                  <div className="p-3" style={{ background: BG }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Perihelion vel. / mean</div>
                    <div className="font-mono text-sm" style={{ color: INK }}>{Math.sqrt((1 + ecc) / (1 - ecc)).toFixed(3)}×</div>
                  </div>
                  <div className="p-3" style={{ background: BG }}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Aphelion vel. / mean</div>
                    <div className="font-mono text-sm" style={{ color: INK }}>{Math.sqrt((1 - ecc) / (1 + ecc)).toFixed(3)}×</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: BORDER }}>
                  {[
                    { e: 0, label: 'Circle' },
                    { e: 0.017, label: 'Earth' },
                    { e: 0.21, label: 'Mercury' },
                    { e: 0.967, label: 'Halley' },
                  ].map(p => (
                    <button key={p.label} onClick={() => setEcc(p.e)}
                            className="p-2 text-center transition hover:bg-white/5"
                            style={{ background: BG }}>
                      <div className="font-mono text-xs" style={{ color: ACCENT }}>{p.label}</div>
                      <div className="font-mono text-[10px] mt-1" style={{ color: DIM }}>e = {p.e}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <OrbitDiagram e={ecc} a={140} size={340} />
              </div>
            </div>
          </div>

          <Section title="Why ellipses, not circles?">
            <p>
              A circle requires very specific initial conditions (velocity exactly perpendicular to the
              radius, at exactly the right magnitude). Any deviation gives an ellipse. Nature doesn't
              generally produce exact circles; what we see in the solar system reflects 4.6 billion years
              of dynamical evolution. Planets formed in roughly circular orbits because their parent
              gas disk dampened deviations. Comets, which formed in the Oort cloud and were scattered
              by planetary encounters, can have extreme eccentricities approaching 1.
            </p>
          </Section>

          <Section title="Kepler's second law: angular momentum at work">
            <p>
              The areal velocity (dA/dt) is constant in any central-force orbit. This is just conservation
              of angular momentum: L = m × r × v_⊥ stays constant. As r shrinks, v_⊥ must grow proportionally.
              That's why Halley's comet whips past the Sun at 54 km/s at perihelion but barely moves at
              0.9 km/s at aphelion — a 60× speed change over its 76-year orbit.
            </p>
            <Eq>dA/dt = L/(2m) = constant   ⇒   r₁v₁ = r₂v₂ at perihelion and aphelion</Eq>
          </Section>
        </div>
      )}

      {tab === 'energy' && (
        <div className="fade-in">
          <Section title="The vis-viva equation: orbital energy and speed">
            <p>
              The single most useful equation in orbital mechanics relates speed v, distance r, and the
              semi-major axis a of an orbit:
            </p>
            <Eq>v² = GM × (2/r − 1/a)</Eq>
            <p>
              From it you can extract just about anything. Circular orbit (r = a): v² = GM/r. Escape orbit
              (a → ∞): v² = 2GM/r — that's escape velocity. Elliptical perihelion (r = a(1 − e)):
              v² = GM/a × (1 + e)/(1 − e). It's all one equation.
            </p>
          </Section>

          <Section title="Total orbital energy">
            <p>
              For a small body of mass m orbiting a much larger body of mass M, the total mechanical energy
              (kinetic + potential) is:
            </p>
            <Eq>E = ½mv² − GMm/r = −GMm/(2a)</Eq>
            <p>
              Three remarkable things. <strong style={{ color: ACCENT }}>One</strong>, the energy depends only
              on a, not on e. Two orbits with the same semi-major axis but very different shapes have the
              same energy. <strong style={{ color: ACCENT }}>Two</strong>, bound orbits (ellipses) have
              negative total energy: you must add energy to reach E = 0 and escape.
              <strong style={{ color: ACCENT }}> Three</strong>, escape (E = 0) corresponds to a parabolic
              trajectory; hyperbolas (E {'>'} 0) are unbound flybys.
            </p>
          </Section>

          <Section title="Escape velocity">
            <p>
              The speed needed to escape a gravitating body from radius r — assuming no propulsion or
              further forces — is:
            </p>
            <Eq>v_esc = √(2GM/r) = √2 × v_circular</Eq>
            <p>
              Earth's surface: 11.2 km/s. Moon's surface: 2.4 km/s. Sun's surface: 617 km/s. Surface of a
              neutron star: ~150,000 km/s (half the speed of light — gravity is starting to be relativistic).
              Black hole event horizon: v_esc = c, which is why nothing escapes.
            </p>
          </Section>

          <Playground
            title="Orbital parameter calculator"
            description="Set a semi-major axis and primary mass — get period, circular speed, and escape velocity. Defaults give Earth around the Sun."
            inputs={[
              { key: 'M', label: 'Primary mass', default: 1.989e30, min: 22, max: 41, log: true, unit: 'kg' },
              { key: 'a', label: 'Semi-major axis', default: 1.496e11, min: 6, max: 16, log: true, unit: 'm' },
            ]}
            compute={(v) => {
              const G = 6.674e-11;
              const P_s = 2 * Math.PI * Math.sqrt(Math.pow(v.a, 3) / (G * v.M));
              const P_yr = P_s / (365.25 * 86400);
              const P_day = P_s / 86400;
              const v_circ = Math.sqrt(G * v.M / v.a);
              const v_esc = Math.sqrt(2 * G * v.M / v.a);
              const a_AU = v.a / 1.496e11;
              const M_solar = v.M / 1.989e30;
              return { P_s, P_yr, P_day, v_circ, v_esc, a_AU, M_solar };
            }}
            outputs={[
              { key: 'M_solar', label: 'Primary mass', unit: 'M☉' },
              { key: 'a_AU', label: 'Semi-major axis', unit: 'AU' },
              { key: 'P_yr', label: 'Orbital period', unit: 'yr' },
              { key: 'P_day', label: 'Orbital period', unit: 'd' },
              { key: 'v_circ', label: 'Circular orbital speed', unit: 'm/s' },
              { key: 'v_esc', label: 'Escape velocity', unit: 'm/s' },
            ]}
          />

          <WorkedExample title="How fast must you launch to escape Earth?"
                         steps={[
                           { text: 'Earth\'s mass M = 5.97 × 10²⁴ kg; radius r = 6,371 km = 6.371 × 10⁶ m. Plug into the escape velocity formula:',
                             eq: 'v_esc = √(2GM/r) = √(2 × 6.674e−11 × 5.97e24 / 6.371e6)' },
                           { text: 'Calculate step by step:',
                             eq: 'v_esc = √(2 × 6.674e−11 × 5.97e24 / 6.371e6) = √(1.25e8) ≈ 11,180 m/s' },
                           { text: 'Note this is the speed required at Earth\'s surface. Rockets actually have it easier in two ways. First, they launch from a moving platform — Earth\'s surface near the equator is already moving at ~465 m/s due to rotation, so launching eastward gives a "free" ~465 m/s. Second, they don\'t need to instantly reach 11.2 km/s; they climb gradually, exchanging altitude (potential energy) for less speed. But the total energy budget needed to escape is exactly E = ½mv_esc².',
                             answer: '11.2 km/s. Note this is just escape from Earth\'s gravity. To escape the Sun from Earth\'s orbit, you also need ~42 km/s — though Earth\'s orbital motion (~30 km/s) provides most of that. Voyager 1, the fastest human object, left Earth at ~16.6 km/s and used gravity assists to reach ~17 km/s, exceeding solar escape velocity from its position.' },
                         ]} />
        </div>
      )}

      {tab === 'shapes' && (
        <div className="fade-in">
          <Section title="The four types of trajectory">
            <p>
              All gravitational orbits are conic sections. Total energy determines which type:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Circle (e = 0).</strong> Special case requiring exact balance.
              Vanishingly rare in nature. Negative energy.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Ellipse (0 {'<'} e {'<'} 1).</strong> All bound orbits.
              Negative total energy. The two foci coincide for a circle and pull apart with increasing
              eccentricity.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Parabola (e = 1).</strong> The boundary case — exactly escape
              velocity, zero total energy at infinity. Vanishingly rare. Comets falling in from the Oort
              cloud approach this limit.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Hyperbola (e {'>'} 1).</strong> Unbound flyby. Positive total
              energy. Interstellar objects like 'Oumuamua and Borisov, which entered the solar system from
              elsewhere, follow hyperbolic paths.
            </p>
          </Section>

          <Section title="Orbital resonances">
            <p>
              When two orbiting bodies have periods related by a small-integer ratio (3:2, 2:1, 4:1, etc.),
              they're in <Term k="orbital resonance">orbital resonance</Term>. Resonances repeatedly line
              up the bodies' gravitational tugs in the same configuration, amplifying their effect.
            </p>
            <p>
              Most planetary systems show resonances. The Jupiter-system Galilean moons (Io : Europa :
              Ganymede = 1 : 2 : 4) are in a Laplace resonance — every fourth orbit of Io, Europa and
              Ganymede return to the same configuration. The resonance keeps Io's orbit eccentric, which
              causes tidal heating that makes it the most volcanically active body in the solar system.
            </p>
            <p>
              Resonances can also be destabilising. The Kirkwood gaps in the asteroid belt at 3:1 and 2:1
              resonances with Jupiter are empty — asteroids that drifted into those resonances were
              perturbed onto chaotic orbits and removed. Saturn's main rings have similar resonance gaps
              with its moons (the Cassini Division is a 2:1 resonance with Mimas).
            </p>
            <p>
              Pluto and Neptune are in 3:2 resonance, which protects them from close encounters despite
              their orbits crossing.
            </p>
          </Section>

          <Section title="When orbits become unstable">
            <p>
              Newton's two-body problem is exactly solvable. The three-body problem is not — it's chaotic
              in general. Tiny perturbations grow exponentially over time. The solar system is technically
              chaotic on timescales of ~5 million years; we can't predict exact planetary positions beyond
              that window even with perfect initial data.
            </p>
            <p>
              On longer timescales, planetary systems can become catastrophically unstable. Simulations
              suggest there's a ~1% chance Mercury's orbit will become wildly eccentric over the next
              billion years, potentially colliding with Venus or being ejected from the solar system. The
              outer solar system is much more stable but is still slowly migrating.
            </p>
          </Section>
        </div>
      )}

      {tab === 'hard' && (
        <div className="fade-in">
          <Section title="The Lagrange points: where gravity balances rotation">
            <p>
              In a two-body system (Sun-Earth, Earth-Moon, etc.) there are five special locations where a
              small third body can orbit synchronously with the larger two — no propulsion needed. These
              are the <Term k="lagrange point">Lagrange points</Term>, predicted in 1772 by Lagrange.
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 my-6 items-center">
              <div>
                <p>
                  <strong style={{ color: ACCENT3 }}>L1</strong> — between the two bodies, where the Sun's
                  gravity is partially cancelled by Earth's. The SOHO and DSCOVR satellites sit here,
                  always between Earth and Sun, monitoring solar wind.
                </p>
                <p>
                  <strong style={{ color: ACCENT3 }}>L2</strong> — on the far side of Earth from the Sun.
                  Earth blocks the Sun's direct radiation. James Webb, Gaia, and several other space
                  telescopes orbit here.
                </p>
                <p>
                  <strong style={{ color: ACCENT3 }}>L3</strong> — on Earth's orbit, opposite the Sun. Always
                  hidden from us. (Historically beloved by science fiction as a place to hide a "counter-Earth.")
                </p>
                <p>
                  <strong style={{ color: '#7aff7a' }}>L4 and L5</strong> — leading and trailing Earth by 60°
                  in its orbit, forming equilateral triangles with Earth and Sun. These are the only stable
                  Lagrange points. The asteroid families "Trojans" at Jupiter's L4 and L5 are the most famous
                  examples — over 12,000 known.
                </p>
              </div>
              <LagrangeDiagram size={340} />
            </div>
            <p>
              L1, L2, and L3 are saddle points — stable in some directions, unstable in others. A satellite
              there needs occasional station-keeping (about ~1 m/s of delta-v per year for JWST at L2). L4
              and L5 are true potential wells, stable to small perturbations as long as the mass ratio of
              the two main bodies is greater than ~25:1.
            </p>
          </Section>

          <Section title="The Roche limit: tidal disruption">
            <p>
              Bring a self-gravitating body too close to a much more massive primary, and tidal forces
              (the difference between the gravitational pull on the near and far sides of the smaller body)
              exceed its own self-gravity. The body tears apart.
            </p>
            <p>
              The critical distance is the <Term k="roche limit">Roche limit</Term>:
            </p>
            <Eq>d_Roche ≈ 2.44 × R_primary × (ρ_primary / ρ_body)^(1/3)   (rigid case ~1.26×)</Eq>
            <p>
              For Saturn, the Roche limit for an icy body sits at ~140,000 km from the planet's centre.
              All of Saturn's main rings lie inside this limit — rings are debris that either never
              accreted into a moon or was once a moon that got too close and was torn apart. Saturn's
              moons proper all lie outside the limit. The pattern repeats at every giant planet: rings
              inside Roche, moons outside.
            </p>
            <p>
              Comet Shoemaker-Levy 9 famously crossed Jupiter's Roche limit in 1992, broke into 21
              fragments, and impacted Jupiter in spectacular fashion in 1994.
            </p>
          </Section>

          <Section title="Tidal forces beyond rings">
            <p>
              The same tidal forces that break apart comets do dramatic things across the universe. The
              Moon raises tides on Earth (and Earth raises larger ones on the Moon, which is why the
              Moon is tidally locked). Io is tidally heated by Jupiter, making it volcanically active.
              Stars wandering too close to supermassive black holes get torn apart in "tidal disruption
              events" that briefly outshine entire galaxies.
            </p>
            <p>
              Tidal forces scale as 1/r³ — stronger than direct gravity (1/r²) at close range. This is why
              they matter for nearby massive companions but not for distant ones.
            </p>
          </Section>
        </div>
      )}

      {tab === 'practical' && (
        <div className="fade-in">
          <Section title="Spacecraft don't travel in straight lines">
            <p>
              In space, "straight" is the most expensive way to go anywhere. Spacecraft instead exploit
              orbital mechanics, riding ellipses and using planetary gravity to change course. Three core
              techniques:
            </p>
          </Section>

          <Section title="The Hohmann transfer">
            <p>
              The most fuel-efficient way to go from one circular orbit to another around the same primary.
              You burn once to enter an elliptical "transfer orbit" whose perihelion is your starting
              orbit and aphelion is your destination. You coast halfway around the ellipse, then burn
              again to circularise.
            </p>
            <p>
              Two impulsive burns, then you wait. Earth-to-Mars Hohmann transfer takes ~8.5 months. You
              can't leave whenever you want — you have to wait until Earth and Mars are in the right
              relative positions, which happens every ~26 months ("synodic period"). Every major Mars
              mission has launched in one of these narrow windows.
            </p>
            <Eq>ΔV total = √(GM/r₁) × (√(2r₂/(r₁+r₂)) − 1) + √(GM/r₂) × (1 − √(2r₁/(r₁+r₂)))</Eq>
            <p>
              For Earth-to-Mars: ΔV ≈ 5.6 km/s on top of solar escape — moderate compared to direct flight
              (which would require ~15 km/s or more).
            </p>
          </Section>

          <Section title="Gravity assists ('slingshots')">
            <p>
              When a spacecraft flies close past a planet, the planet's gravity bends its trajectory.
              In the planet's frame, the spacecraft enters and exits at the same speed (energy is
              conserved). But in the Sun's frame, the encounter has rotated the spacecraft's velocity
              vector relative to the planet's orbital motion — typically <em>adding</em> the planet's
              orbital speed to the spacecraft's outgoing direction.
            </p>
            <p>
              Voyager 2 reached Neptune in 12 years thanks to a 1979 Jupiter flyby that boosted it by
              ~10 km/s, followed by Saturn (1981) and Uranus (1986) assists. Without gravity assists, the
              same trajectory would have required tens of times more fuel and decades more transit time.
            </p>
            <p>
              The total energy is conserved — the planet loses an infinitesimal amount of orbital energy
              (slowing Jupiter's orbit by ~10⁻²⁵ m/s — utterly negligible) and the spacecraft gains
              correspondingly.
            </p>
          </Section>

          <Section title="Halo orbits">
            <p>
              Around L1 and L2 (which are saddle points, not minima) spacecraft fly in "halo orbits" —
              gentle loops that don't sit precisely at the Lagrange point but precess around it. JWST
              follows a halo orbit around Sun-Earth L2 with a period of ~6 months, allowing it to keep
              its sunshield correctly oriented while never falling into Earth's shadow.
            </p>
          </Section>

          <Playground
            title="Hohmann transfer ΔV calculator"
            description="Compute total delta-v for a Hohmann transfer between two circular orbits around the Sun. Try Earth (1 AU) to Mars (1.52), Jupiter (5.2), or further."
            inputs={[
              { key: 'r1', label: 'Starting orbit (from Sun)', default: 1.0, min: 0.3, max: 50, step: 0.01, unit: 'AU' },
              { key: 'r2', label: 'Destination orbit (from Sun)', default: 1.52, min: 0.3, max: 50, step: 0.01, unit: 'AU' },
            ]}
            compute={(v) => {
              const G = 6.674e-11, Msun = 1.989e30, AU = 1.496e11;
              const r1 = v.r1 * AU, r2 = v.r2 * AU;
              const v1 = Math.sqrt(G * Msun / r1);
              const v2 = Math.sqrt(G * Msun / r2);
              const vt1 = Math.sqrt(G * Msun * (2 / r1 - 2 / (r1 + r2)));
              const vt2 = Math.sqrt(G * Msun * (2 / r2 - 2 / (r1 + r2)));
              const dv1 = Math.abs(vt1 - v1);
              const dv2 = Math.abs(v2 - vt2);
              const dv_total = dv1 + dv2;
              const a_transfer = (r1 + r2) / 2;
              const P_transfer_s = 2 * Math.PI * Math.sqrt(Math.pow(a_transfer, 3) / (G * Msun));
              const travel_days = P_transfer_s / 2 / 86400;
              return { dv1, dv2, dv_total, travel_days, v1, v2 };
            }}
            outputs={[
              { key: 'v1', label: 'Starting orbit speed', unit: 'm/s' },
              { key: 'v2', label: 'Destination orbit speed', unit: 'm/s' },
              { key: 'dv1', label: 'First burn ΔV', unit: 'm/s' },
              { key: 'dv2', label: 'Second burn ΔV', unit: 'm/s' },
              { key: 'dv_total', label: 'Total ΔV required', unit: 'm/s' },
              { key: 'travel_days', label: 'Transit time (one-way)', unit: 'days' },
            ]}
          />

          <Section title="The Oberth effect">
            <p>
              For chemical-rocket missions to the outer planets, burning at perihelion (closest approach
              to the primary) gives much more bang for your fuel than burning at aphelion. The reason is
              that kinetic energy goes as v² — at higher v, every ΔV you add changes your energy more.
              Burning 1 m/s of ΔV at 50 km/s adds 50× more energy than burning the same 1 m/s at 1 km/s.
            </p>
            <p>
              This is the Oberth effect. The Parker Solar Probe uses it to make ever-tighter passes around
              the Sun: each gravity assist at Venus reshapes its orbit, and each perihelion burn is
              maximally effective. The probe reaches ~190 km/s at closest approach — the fastest any
              human object has ever moved.
            </p>
          </Section>
        </div>
      )}

      <WorkedExample title="Why does Jupiter's gravity assist help Voyager so much?"
                     steps={[
                       { text: 'Imagine Voyager approaching Jupiter at 10 km/s relative to Jupiter. Jupiter itself orbits the Sun at 13 km/s. In the Sun\'s frame, Voyager\'s speed depends on the geometry.',
                         eq: 'v_approach (Sun frame) = depends on direction' },
                       { text: 'A grazing flyby on Jupiter\'s leading edge: Voyager enters at 10 km/s relative to Jupiter, gets bent ~180° around it (a very close flyby could bend even more, but ~180° is the limit for a deep pass), and exits at 10 km/s in the OPPOSITE direction relative to Jupiter.',
                         eq: 'In Sun frame: from (13 − 10) = 3 km/s before to (13 + 10) = 23 km/s after' },
                       { text: 'Voyager gained 20 km/s of Sun-relative velocity from a Jupiter flyby that, in Jupiter\'s frame, conserved energy. Where did that energy come from?',
                         eq: 'Jupiter\'s orbital velocity reduced by an utterly negligible amount: ~10⁻²⁵ m/s.',
                         answer: 'The Sun frame change is real — Voyager really sped up by ~10 km/s through the encounter (in reality, less than 20 km/s because the deflection is less than 180°). Jupiter "lost" a corresponding amount of orbital momentum, but Jupiter is so much more massive that the velocity change is unmeasurable. It\'s as if Voyager bounced off a moving wall: in the wall\'s frame nothing changed, but in the ground frame it gained 2× the wall\'s velocity.' },
                     ]} />

      <Quiz questions={[
        { q: 'Kepler\'s second law (equal areas in equal times) is equivalent to:',
          options: ['Conservation of energy', 'Conservation of angular momentum', 'Conservation of linear momentum', 'Newton\'s third law'],
          correct: 1,
          explain: 'A line from the Sun to the planet sweeps area at rate dA/dt = ½ |r × v| = L / 2m. Since gravity is a central force (always points along r), torque is zero and angular momentum L is conserved. Equal areas in equal times = constant L.' },
        { q: 'You double your distance from a planet. Gravity\'s force on you:',
          options: ['Halves', 'Quarters', 'Stays the same', 'Doubles'],
          correct: 1,
          explain: 'Inverse-square law: F ∝ 1/r². Double the distance and force drops by 4×. This is why orbits are closed ellipses — only inverse-square forces (and harmonic forces) produce that property, by Bertrand\'s theorem.' },
        { q: 'A satellite in low Earth orbit moves at ~7.7 km/s. To escape Earth from the same altitude, you need:',
          options: ['7.7 km/s', '~10.9 km/s', '~13.7 km/s', '~25 km/s'],
          correct: 1,
          explain: 'v_escape = √2 × v_circular ≈ 1.414 × 7.7 ≈ 10.9 km/s. From Earth\'s surface, ground-level escape velocity is 11.2 km/s; the small difference between LEO and the surface (~400 km altitude) accounts for the slight reduction.' },
        { q: 'Saturn\'s rings exist primarily because:',
          options: ['Saturn\'s moons leave debris', 'They lie inside Saturn\'s Roche limit, where tidal forces prevent moon formation', 'They\'re leftover ice from formation', 'A passing comet was captured'],
          correct: 1,
          explain: 'The Roche limit is the distance below which tidal forces exceed self-gravity — a self-gravitating moon would be torn apart. All of Saturn\'s main rings lie inside its Roche limit. Material there either fell in from elsewhere (perhaps a destroyed moon) or never coalesced into a moon. Saturn\'s actual moons all orbit outside the Roche limit.' },
        { q: 'JWST sits at the Sun-Earth L2 point because:',
          options: ['It\'s stable indefinitely with no station-keeping needed', 'Earth blocks the Sun\'s direct radiation while the spacecraft orbits with Earth around the Sun', 'It\'s the closest stable point to Earth', 'L2 has the best view of the universe'],
          correct: 1,
          explain: 'L2 is on Earth\'s anti-sunward side, ~1.5 million km out. Earth + Sun\'s combined gravity exactly matches the centripetal acceleration needed for a 1-year orbit at L2\'s distance — so JWST orbits the Sun in lockstep with Earth, always shadowed. L2 is technically unstable (a saddle), so JWST does need occasional station-keeping (~1 m/s/year of ΔV).' },
      ]} />

      <TryThis title="Build your orbital intuition"
               items={[
                 { title: 'Play Kerbal Space Program', text: 'The single best way to develop orbital intuition is to actually fly missions in this physics simulator. You\'ll learn rendezvous, Hohmann transfers, gravity assists, and station-keeping through hands-on experience. Many professional aerospace engineers credit it with teaching them more than any textbook.', gear: 'A computer + ~$40 game' },
                 { title: 'Watch the ISS pass overhead', text: 'Use Heavens-Above or NASA\'s "Spot the Station" to find when the ISS passes over your location. It\'s moving at ~7.7 km/s in real time. Watch it traverse the sky in 3-5 minutes — that motion is what falling sideways forever actually looks like.', gear: 'Eyes + a clear sky' },
                 { title: 'Trace Mars\'s retrograde motion', text: 'Plot Mars\'s position against background stars over a few months when it\'s near opposition. You\'ll see it appear to slow, stop, reverse direction (retrograde motion), then resume normal direction. This is purely a perspective effect from Earth\'s faster inner orbit overtaking Mars — the puzzle that drove Kepler\'s work.', gear: 'Stellarium app + patience' },
                 { title: 'Calculate when to launch to Mars', text: 'Using Earth\'s orbital position today and Mars\'s, work out roughly when the next Hohmann launch window occurs. (Hint: synodic period is ~26 months.) Check against NASA\'s planned launches.', gear: 'A bit of arithmetic' },
               ]} />

      <OpenQuestions items={[
        { q: 'Is the solar system actually stable long-term?',
          detail: '— Numerical simulations show the solar system is technically chaotic. Mercury\'s eccentricity may grow secularly over Gyr timescales; there\'s ~1% probability it becomes unstable enough to collide with Venus or Earth, or be ejected, over the next 5 Gyr. Our future is statistical, not deterministic.' },
        { q: 'Where exactly is the boundary of the Oort cloud?',
          detail: '— The Oort cloud is the inferred origin of long-period comets. Its inner edge is ~2,000 AU, but the outer edge is uncertain — perhaps 50,000-200,000 AU. Stars passing close to the Sun (every few Myr) can perturb Oort cloud objects, dropping them inward. The detailed dynamics are still being mapped.' },
        { q: 'How common are stable habitable orbits around other stars?',
          detail: '— Around binaries, around tight resonances, around varying-mass post-main-sequence stars — many configurations might exist. Kepler discovered "Tatooine" planets orbiting two stars (Kepler-16). Stability of planets in such systems on geological timescales is still being characterised.' },
        { q: 'Why is the solar system\'s architecture (small inner rocky, gas giants, ice giants, Kuiper belt) typical or atypical?',
          detail: '— Kepler statistics show our solar system\'s arrangement is actually unusual. "Super-Earths" (1-10 M_Earth, between Earth and Neptune in size) are the most common planet type in the galaxy — but we have zero. Most systems found also pack their large planets in tighter than the Sun\'s. Why? Our giant planets\' migration history (the Nice and Grand Tack models) is one proposed explanation but isn\'t settled.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  16 · THE SOLAR SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

const PLANETS = [
  { id: 'mer', name: 'Mercury', type: 'terrestrial',
    r_au: 0.387, radius_E: 0.383, mass_E: 0.055, day_h: 4222.6, year_d: 88, T_K: '100–700',
    atm: 'Negligible (exosphere of Na, K, He)',
    moons: 0,
    fact: 'Smallest planet. No atmosphere to redistribute heat — surface temperature swings 600 K between day and night. Polar craters in permanent shadow may harbor water ice.' },
  { id: 'ven', name: 'Venus', type: 'terrestrial',
    r_au: 0.723, radius_E: 0.949, mass_E: 0.815, day_h: -5832.5, year_d: 224.7, T_K: '737',
    atm: '96% CO₂, 92 bar, sulfuric acid clouds',
    moons: 0,
    fact: 'Hottest planet despite being further from Sun than Mercury. Runaway greenhouse effect. Rotates backwards (retrograde) once every 243 Earth days — slower than its 225-day year.' },
  { id: 'ear', name: 'Earth', type: 'terrestrial',
    r_au: 1.0, radius_E: 1.0, mass_E: 1.0, day_h: 23.93, year_d: 365.25, T_K: '288',
    atm: '78% N₂, 21% O₂, 1% Ar',
    moons: 1,
    fact: 'The only known body with surface liquid water and plate tectonics. The O₂ atmosphere is biological in origin — a direct biosignature.' },
  { id: 'mar', name: 'Mars', type: 'terrestrial',
    r_au: 1.524, radius_E: 0.532, mass_E: 0.107, day_h: 24.62, year_d: 687, T_K: '210',
    atm: '95% CO₂, 0.006 bar — too thin to retain heat',
    moons: 2,
    fact: 'Once had liquid water and an atmosphere; lost both as its core cooled and the magnetic field shut off. Olympus Mons (~22 km tall) is the tallest known volcano in the Solar System.' },
  { id: 'jup', name: 'Jupiter', type: 'gas giant',
    r_au: 5.203, radius_E: 11.21, mass_E: 317.8, day_h: 9.93, year_d: 4332.6, T_K: '165 (1 bar level)',
    atm: '90% H, 10% He, traces of NH₃, CH₄',
    moons: 95,
    fact: 'Most massive planet — 2.5× the rest of the Solar System combined. The Great Red Spot is a 350+ year-old storm bigger than Earth. Spins so fast (10 hr) that it\'s noticeably oblate.' },
  { id: 'sat', name: 'Saturn', type: 'gas giant',
    r_au: 9.537, radius_E: 9.45, mass_E: 95.16, day_h: 10.66, year_d: 10759, T_K: '134 (1 bar level)',
    atm: '96% H, 3% He',
    moons: 146,
    fact: 'Least dense planet (0.69 g/cm³) — would float in water if you had a bathtub big enough. Spectacular ring system spans ~270,000 km but is only ~10 m thick.' },
  { id: 'ura', name: 'Uranus', type: 'ice giant',
    r_au: 19.19, radius_E: 4.01, mass_E: 14.54, day_h: -17.24, year_d: 30687, T_K: '76',
    atm: '83% H, 15% He, 2% CH₄ (gives it blue colour)',
    moons: 28,
    fact: 'Tipped on its side (axial tilt 98°) — probably from a massive ancient impact. Each pole gets 42 years of continuous sunlight followed by 42 years of darkness.' },
  { id: 'nep', name: 'Neptune', type: 'ice giant',
    r_au: 30.07, radius_E: 3.88, mass_E: 17.15, day_h: 16.11, year_d: 60190, T_K: '72',
    atm: '80% H, 19% He, 1% CH₄',
    moons: 16,
    fact: 'Strongest winds in the Solar System (up to 2,100 km/h). Was discovered by mathematics (Le Verrier 1846) before being observed — its existence inferred from anomalies in Uranus\'s orbit.' },
];

function SolarSystem({ onBack }) {
  const [tab, setTab] = useState('worlds');
  const [planetIdx, setPlanetIdx] = useState(3); // Earth default

  const p = PLANETS[planetIdx];

  return (
    <PageShell onBack={onBack} eyebrow="03 — Our Cosmic Neighbourhood"
               title={<>The <em style={{ color: ACCENT, fontStyle: 'italic' }}>Solar System</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Eight planets, hundreds of moons, millions of asteroids, trillions of comets, all orbiting a
        single star. The Solar System is the only planetary system we can study up close — the
        ground-truth against which we calibrate everything we learn about exoplanets, planetary
        formation, and habitability. It also happens to contain the only life we know of.
      </p>

      {/* Tabs */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-px mb-6" style={{ background: BORDER }}>
        {[
          ['worlds', 'The Eight Worlds'],
          ['formation', 'Formation'],
          ['smallbodies', 'Asteroids & Comets'],
          ['rings', 'Rings & Moons'],
          ['active', 'Active Frontiers'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
                  className="p-3 md:p-4 text-center transition"
                  style={{ background: tab === id ? `${ACCENT}15` : BG,
                           borderTop: tab === id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-xs md:text-sm" style={{ color: tab === id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{label}</div>
          </button>
        ))}
      </div>

      {tab === 'worlds' && (
        <div className="fade-in">
          <Section title="Two families of planets">
            <p>
              The inner four planets (Mercury, Venus, Earth, Mars) are <strong style={{ color: ACCENT }}>terrestrial</strong> —
              rocky, dense (3.9–5.5 g/cm³), small (under 1.3 Earth radii), with thin or absent atmospheres.
              They formed inside the <Term k="frost line">frost line</Term>, where the young Sun was hot
              enough to vaporise water ice and the only available solids were metals and silicates.
            </p>
            <p>
              The outer four (Jupiter, Saturn, Uranus, Neptune) are <strong style={{ color: ACCENT }}>giants</strong> —
              mostly hydrogen and helium with substantial water/methane/ammonia ice envelopes. Saturn is
              less dense than water; Jupiter is mostly fluid metallic hydrogen below its visible cloud
              tops. None has a true surface in the terrestrial sense. They formed beyond the frost line
              where ices could condense, giving their planetesimal cores more material to grow large
              enough (~10 Earth masses) to capture and retain gas from the solar nebula.
            </p>
            <p>
              A finer distinction: Jupiter and Saturn are <strong style={{ color: ACCENT }}>gas giants</strong>
              dominated by H/He. Uranus and Neptune are <strong style={{ color: ACCENT }}>ice giants</strong>,
              dominated by water/methane/ammonia (in supercritical fluid form). The distinction matters
              because the formation pathways and interior physics differ substantially.
            </p>
          </Section>

          <div className="my-8">
            <div className="grid grid-cols-4 md:grid-cols-8 gap-px mb-6" style={{ background: BORDER }}>
              {PLANETS.map((pl, i) => (
                <button key={pl.id} onClick={() => setPlanetIdx(i)}
                        className="p-3 text-center transition"
                        style={{ background: planetIdx === i ? `${ACCENT}10` : BG,
                                 borderTop: planetIdx === i ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
                  <div className="font-display text-sm" style={{ color: planetIdx === i ? ACCENT : INK }}>{pl.name}</div>
                </button>
              ))}
            </div>

            <div className="fade-in" key={p.id}>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-display text-3xl" style={{ letterSpacing: '-0.02em' }}>{p.name}</h3>
                <span className="font-mono text-xs uppercase tracking-[0.2em]" style={{ color: ACCENT }}>{p.type}</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-6" style={{ background: BORDER }}>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Distance from Sun</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{p.r_au} AU</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Radius (Earth = 1)</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{p.radius_E}</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Mass (Earth = 1)</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{p.mass_E}</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Day length</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{p.day_h < 0 ? `${Math.abs(p.day_h).toFixed(1)} h (retrograde)` : `${p.day_h.toFixed(1)} h`}</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Year</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{p.year_d} d</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Surface T</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{p.T_K} K</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Moons</div>
                  <div className="font-mono text-base" style={{ color: INK }}>{p.moons}</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Atmosphere</div>
                  <div className="font-display text-sm" style={{ color: INK }}>{p.atm}</div>
                </div>
              </div>

              <p className="font-display text-base leading-relaxed" style={{ color: '#c8c3b1' }}>{p.fact}</p>
            </div>
          </div>

          <Section title="Surfaces and atmospheres tell stories">
            <p>
              A planet's surface preserves its history. <strong style={{ color: ACCENT }}>Cratering</strong>
              is the universal record-keeper: every airless body retains every impact ever to hit it. The
              Moon's heavily-cratered far side has been recording the inner Solar System's bombardment for
              4 billion years.
            </p>
            <p>
              Earth, by contrast, has almost no large craters — they're erased by erosion, plate tectonics,
              and atmosphere. Venus is similar (volcanic resurfacing). Mars sits between: enough geological
              activity to bury old craters but not enough to keep up with new impacts. Mercury and the
              Moon look frozen in time.
            </p>
            <p>
              Atmospheres are equally informative. Earth's free oxygen is biologically maintained — it
              would oxidise away in ~10 million years without life. Venus's CO₂ atmosphere is the
              outcome of a runaway greenhouse: surface heat vaporised oceans, water vapour amplified
              warming, oceans boiled into the atmosphere, and the hydrogen subsequently escaped to space.
              Once started, it can\'t reverse. Mars lost most of its atmosphere to space when its
              core solidified and its magnetic field shut off ~3.8 Gyr ago.
            </p>
          </Section>

          <Section title="What makes Earth different?">
            <p>
              Several apparently unrelated features set Earth apart: a large Moon, plate tectonics, a
              strong magnetic field, liquid water, a nitrogen-oxygen atmosphere, and life. These may
              be linked.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>The Moon</strong> probably formed from a Mars-sized impactor
              hitting proto-Earth. The collision stripped much of Earth's mantle, leaving us with an
              unusually dense interior, and also gifted Earth significant axial tilt and rotational
              angular momentum.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Plate tectonics</strong> require a hot interior and a
              specific viscosity range — too hot, and you get a Venus-style stagnant lid; too cool, and
              you get Mars-style frozen tectonics. Plate tectonics also act as a CO₂ thermostat: silicate
              weathering removes CO₂; volcanic outgassing replaces it; equilibrium stabilises Earth's
              climate over geological timescales.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>The magnetic field</strong> protects the atmosphere from
              solar wind stripping. It requires a liquid metallic core sustained by convection — which
              requires sufficient heat. Once a small planet's core solidifies (as Mars\'s did), the
              dynamo dies, the field collapses, and the atmosphere bleeds away.
            </p>
            <p>
              Whether all this together is "rare" or "common" is one of the great questions in astrobiology.
            </p>
          </Section>
        </div>
      )}

      {tab === 'formation' && (
        <div className="fade-in">
          <Section title="How a solar system forms">
            <p>
              ~4.6 billion years ago, a region of a giant molecular cloud (mostly hydrogen, ~1% heavier
              elements from previous stellar generations) became gravitationally unstable and collapsed.
              Conservation of angular momentum spun it into a flattened, rotating disc — the solar
              nebula. At the centre, density rose until thermonuclear fusion ignited and the Sun was
              born.
            </p>
            <p>
              Within the disc, dust grains collided and stuck together, growing from microns to
              centimetres to kilometres over a few million years. Once bodies reached ~1 km
              (<Term k="planetesimal">planetesimals</Term>), their mutual gravity dominated and growth
              accelerated. The biggest survivors became planetary embryos; chaotic collisions among
              embryos produced the final planets.
            </p>
          </Section>

          <Section title="The frost line and the two-family pattern">
            <p>
              Temperature in the protoplanetary disc fell with distance from the young Sun. At ~3 AU lay
              the <Term k="frost line">frost line</Term> — beyond which water, methane, and ammonia
              could condense as solid ice. The solid materials available for accretion roughly tripled
              outside the frost line compared to inside.
            </p>
            <p>
              Inside the frost line, the only available solids were silicates and metals, producing
              small rocky planets that ran out of material before reaching gas-capturing mass. Outside
              the frost line, abundant ices let cores grow to ~10 Earth masses fast enough to
              gravitationally capture and retain hydrogen and helium gas from the surrounding disc —
              producing the giant planets.
            </p>
            <p>
              The Sun blew away the disc gas within ~5 Myr after forming. Cores that hadn't reached
              critical mass by then (Uranus, Neptune, possibly the rocky planets) were left as bare
              cores. Cores that did reach critical mass (Jupiter, Saturn) became gas giants.
            </p>
          </Section>

          <Section title="Migration: planets don't stay where they form">
            <p>
              Theoretical models from the late 1990s onward (and confirmed by exoplanet observations)
              show that planets gravitationally interact with the gas disc they form in, exchanging
              angular momentum. The result: planets migrate, often inward.
            </p>
            <p>
              The "Nice Model" (proposed 2005) of Solar System history holds that the giant planets
              formed closer together than they are now and migrated outward as Neptune scattered Kuiper
              belt objects. Jupiter and Saturn briefly crossed a 2:1 resonance, which destabilised
              orbits across the Solar System — likely causing the Late Heavy Bombardment (~3.9 Gyr ago,
              evidenced by lunar crater statistics).
            </p>
            <p>
              The "Grand Tack" model goes further: Jupiter may have migrated inward to ~1.5 AU before
              being pulled back outward by Saturn. This would have starved the inner Solar System of
              material, explaining why Mars is small and the asteroid belt has so little mass.
            </p>
          </Section>

          <Section title="The asteroid belt: a planet that never was">
            <p>
              Between Mars and Jupiter lies the main asteroid belt — millions of rocky bodies, the
              largest being Ceres (~940 km diameter, since 2006 classified as a dwarf planet). Total
              mass of the entire belt is less than 5% of the Moon's mass.
            </p>
            <p>
              The belt is what's left when planet formation fails. Jupiter's gravity stirred up
              planetesimal velocities so much that collisions tended to fragment rather than accrete.
              The belt also has gaps at orbital resonances with Jupiter (Kirkwood gaps) where bodies
              were scattered out.
            </p>
            <p>
              Asteroids are time capsules of early Solar System chemistry — particularly the C-type
              (carbonaceous) asteroids of the outer belt, which preserve volatiles and organics largely
              unchanged since formation. NASA's OSIRIS-REx (Bennu, 2020) and JAXA's Hayabusa2 (Ryugu,
              2019) brought back samples for laboratory analysis.
            </p>
          </Section>
        </div>
      )}

      {tab === 'smallbodies' && (
        <div className="fade-in">
          <Section title="Three populations of small bodies">
            <p>
              Beyond the eight planets, the Solar System contains three large populations of leftover
              bodies — each in a distinct dynamical environment:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Asteroids</strong> — rocky bodies mostly between 2 and 4 AU
              from the Sun (main belt). ~1 million known objects {'>'} 1 km. Stirred by Jupiter\'s gravity;
              compositions vary from primitive (C-type) to differentiated (S-type, M-type).
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Kuiper Belt Objects (KBOs)</strong> — icy bodies between
              30 and 50 AU. Pluto is the most famous; over 1,000 are known {'>'} 100 km. The Kuiper Belt is
              the source of short-period (P {'<'} 200 yr) comets like Halley.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Oort Cloud Objects</strong> — inferred icy bodies at
              2,000–200,000 AU in a roughly spherical halo. Never directly observed. Source of long-period
              comets like Hale-Bopp and ISON. Total population estimated at ~10¹¹ bodies.
            </p>
          </Section>

          <Section title="Comets: dirty snowballs from the deep freeze">
            <p>
              Comets are icy planetesimals, ~1–50 km across, composed of water ice, frozen CO₂ and CO,
              ammonia, methane, and organic compounds, plus dust ("dirty snowball" — Fred Whipple,
              1950). When they swing in close to the Sun (within ~3 AU), the ices sublime, releasing gas
              and dust that form the spectacular <strong style={{ color: ACCENT }}>tail</strong>.
            </p>
            <p>
              A comet actually has two tails: a <strong style={{ color: ACCENT }}>dust tail</strong>
              (curved, yellow-white, from sunlight pressure on dust grains) and an
              <strong style={{ color: ACCENT }}> ion tail</strong> (straight, blue, from the solar wind
              dragging ionised gases). Both always point away from the Sun, not in the direction of
              motion. A comet receding from the Sun has its tail "in front" of it.
            </p>
            <p>
              Comet 67P/Churyumov-Gerasimenko was visited by ESA's Rosetta mission (2014-2016), which
              also landed Philae on the surface. Findings included complex organics, abundant water ice
              (but with a different deuterium/hydrogen ratio than Earth's oceans, suggesting Earth's
              water came mostly from asteroids, not comets), and a surprisingly low density (~0.5 g/cm³ —
              the comet is half empty space).
            </p>
          </Section>

          <Section title="Meteorites: free samples from space">
            <p>
              Meteorites — fragments of asteroids, comets, the Moon, or Mars that survive atmospheric
              entry — provide our most direct samples of other Solar System bodies. The oldest
              meteorites contain inclusions dated to 4.567 ± 0.001 billion years — the formation age of
              the Solar System, measured radiometrically.
            </p>
            <p>
              Three main types:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Chondrites</strong> (~85%) — primitive, never melted,
              preserving the chemistry of the early solar nebula. Carbonaceous chondrites contain amino
              acids and other organic molecules — interesting for astrobiology.<br/>
              <strong style={{ color: ACCENT }}>Achondrites</strong> (~8%) — fragments of differentiated
              parent bodies, similar to terrestrial igneous rocks. Some are confirmed lunar or Martian
              meteorites (identified by their distinctive isotopic compositions).<br/>
              <strong style={{ color: ACCENT }}>Iron meteorites</strong> (~6%) — cores of disrupted
              planetary embryos. Composed mostly of iron-nickel alloy.
            </p>
            <p>
              About 100 tonnes of meteoritic material falls on Earth each day (mostly as dust). Major
              impacts are rare but consequential: the Chicxulub impactor (~10 km, 66 Mya) wiped out
              the non-avian dinosaurs. Modern surveys (LINEAR, ATLAS, the Vera C. Rubin Observatory)
              track all near-Earth asteroids {'>'} 1 km — none currently on impact trajectory.
            </p>
          </Section>

          <Section title="Pluto and the dwarf planets">
            <p>
              In 2006, the IAU redefined "planet" to require three things: orbits the Sun; round (in
              hydrostatic equilibrium); and has "cleared its orbital neighbourhood" of other bodies.
              Pluto fails the third — it shares its neighbourhood with countless other KBOs.
            </p>
            <p>
              Dwarf planets are bodies meeting the first two but not the third. Officially recognised:
              Pluto, Eris, Haumea, Makemake (all KBOs), and Ceres (in the asteroid belt). Likely
              candidates pending IAU recognition: Sedna, Orcus, Quaoar, Gonggong, and others — total
              probably 50–200 trans-Neptunian dwarf planets eventually.
            </p>
            <p>
              The 2015 New Horizons flyby of Pluto revealed an extraordinarily geologically active world
              with nitrogen ice glaciers flowing across plains of solid nitrogen and methane, mountains
              of water ice, and possible cryovolcanism. Pluto has just enough internal heat to remain
              active — unexpected for a body so far from the Sun.
            </p>
          </Section>
        </div>
      )}

      {tab === 'rings' && (
        <div className="fade-in">
          <Section title="Why giant planets have rings">
            <p>
              All four giant planets have ring systems. Saturn's are by far the most spectacular —
              spanning ~270,000 km but only ~10 metres thick, containing 99.9% water ice. Jupiter's
              rings are faint and dusty. Uranus has narrow, dark rings. Neptune has incomplete "ring arcs"
              held together by shepherd moons.
            </p>
            <p>
              Rings exist where moons can't. All four giant planets' main ring systems lie inside the
              <Term k="roche limit"> Roche limit</Term> — the distance below which tidal forces exceed
              self-gravity. Material there can't accrete into a moon; any moon that strayed inside
              would tear apart.
            </p>
          </Section>

          <Section title="Where Saturn's rings come from">
            <p>
              For decades it was assumed the rings were primordial — leftover material from Saturn's
              formation. But Cassini\'s observations (2004-2017) suggest they're much younger: only
              ~100–400 million years old. The evidence is their cleanness — they're 99.9% pure water
              ice with very little contamination from meteoritic dust, which has been falling on them
              continuously.
            </p>
            <p>
              The current best theory: a moon, or small icy body, strayed too close to Saturn (perhaps
              perturbed by Titan), crossed the Roche limit, and was torn apart. The remains spread into
              the disc-shaped ring system we see now.
            </p>
            <p>
              Cassini also found that the rings are slowly raining material onto Saturn at a rate of
              ~10 tonnes per second. At this rate, the rings will dissipate in ~100–300 million years.
              We are extraordinarily lucky to observe them at all in cosmic terms.
            </p>
          </Section>

          <Section title="Moons of the outer Solar System">
            <p>
              Giant planet moons are some of the most interesting objects in the Solar System. A few
              standouts:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Io</strong> (Jupiter) — the most volcanically active body
              known. Tidal heating from Jupiter and orbital resonance with Europa and Ganymede keeps
              its interior molten. Hundreds of active volcanoes resurface it every ~1 million years.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Europa</strong> (Jupiter) — subsurface ocean beneath
              ~20 km of ice. Tidally heated. Twice as much liquid water as all Earth's oceans combined.
              Strong astrobiology target. Europa Clipper (launched 2024) will arrive 2030.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Ganymede</strong> (Jupiter) — largest moon in the Solar
              System (larger than Mercury). Has its own magnetic field — the only moon with one.
              Internal water-ice ocean.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Titan</strong> (Saturn) — only moon with a thick atmosphere
              (1.45 bar, nitrogen + methane). Surface has rivers and lakes of liquid methane and ethane,
              dunes of organic compounds. Cassini-Huygens landed there in 2005. Dragonfly mission
              (launching 2028) will fly a quadcopter across its surface.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Enceladus</strong> (Saturn) — small icy moon with active
              cryogeysers erupting from its south pole. Cassini flew through the plumes and detected
              water, salts, organics, and hydrogen — all the ingredients for life. Strong astrobiology
              target.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Triton</strong> (Neptune) — large moon orbiting backwards,
              probably captured from the Kuiper belt. Active cryovolcanism, thin nitrogen atmosphere.
            </p>
          </Section>

          <Section title="The habitable zone, rewritten">
            <p>
              Traditional habitable-zone thinking placed liquid water (and thus life) at planet distances
              receiving ~Earth-like sunlight. But Europa, Enceladus, and Titan are far outside that
              zone, yet have liquid water beneath their icy crusts — kept liquid by tidal heating, not
              solar radiation.
            </p>
            <p>
              This dramatically expands where life might exist. A planet around an M dwarf with the
              right tidal heating could have a subsurface ocean for billions of years. So could "rogue"
              planets ejected from their star systems, drifting through interstellar space.
            </p>
          </Section>
        </div>
      )}

      {tab === 'active' && (
        <div className="fade-in">
          <Section title="What we're actively exploring right now">
            <p>
              The Solar System is being explored at a pace unprecedented in history. A partial inventory
              of current major missions:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Mars</strong> — Perseverance (rover, 2020–), Curiosity
              (rover, 2012–), Ingenuity helicopter (now retired), multiple orbiters (MRO, MAVEN, Hope).
              Sample return planned for ~2033.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>The Moon</strong> — Artemis program (US-led return),
              Chang\'e missions (China, including far-side sample returns), Chandrayaan (India). Multiple
              landers planned 2024–2030.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>The Sun</strong> — Parker Solar Probe (closest-ever flybys),
              Solar Orbiter (high-latitude views). Active heliophysics observation.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Asteroids</strong> — Lucy (touring Jupiter Trojans), Psyche
              (heading to metal asteroid 16 Psyche). OSIRIS-APEX (extended mission after Bennu return).
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Outer Solar System</strong> — JUICE (ESA, Jupiter system),
              Europa Clipper (NASA, launched 2024). Dragonfly to Titan launching 2028.
            </p>
          </Section>

          <Section title="The Vera C. Rubin Observatory">
            <p>
              Just starting operations: an 8.4-m telescope in Chile that will survey the entire visible
              sky every 3-4 nights for 10 years. Among many science goals, it will discover an estimated
              5+ million new asteroids, hundreds of thousands of new trans-Neptunian objects, and
              probably the first interstellar comets in real time as they enter the Solar System.
            </p>
          </Section>

          <Section title="Planet Nine?">
            <p>
              Several extreme trans-Neptunian objects (Sedna, 2012 VP113, others) have similar orbital
              alignments, hinting at gravitational perturbation by an unseen large body. Predictions
              (Batygin & Brown, 2016) suggest a ~5–10 Earth-mass planet at ~400–800 AU.
            </p>
            <p>
              Despite intensive searches, "Planet Nine" remains undetected. It could be there but very
              hard to see (extremely distant, dim, slow-moving). Or the orbital alignment might be
              statistical fluke. The Vera C. Rubin Observatory should settle the question within a
              decade.
            </p>
          </Section>
        </div>
      )}

      <Playground
        title="Surface gravity and escape velocity"
        description="A body's surface gravity is g = GM/r². Escape velocity is v_esc = √(2GM/r). Try the planets — or invent a hypothetical world."
        inputs={[
          { key: 'M', label: 'Mass (Earth = 1)', default: 1, min: -3, max: 3, log: true, unit: 'M⊕' },
          { key: 'R', label: 'Radius (Earth = 1)', default: 1, min: -1.5, max: 1.5, log: true, unit: 'R⊕' },
        ]}
        compute={(v) => {
          const G = 6.674e-11;
          const M_kg = v.M * 5.972e24;
          const R_m = v.R * 6.371e6;
          const g = G * M_kg / Math.pow(R_m, 2);
          const v_esc = Math.sqrt(2 * G * M_kg / R_m);
          const v_esc_km_s = v_esc / 1000;
          const g_in_earth = g / 9.81;
          const density = M_kg / ((4/3) * Math.PI * Math.pow(R_m, 3));
          return { g, g_in_earth, v_esc_km_s, density };
        }}
        outputs={[
          { key: 'g', label: 'Surface gravity', unit: 'm/s²' },
          { key: 'g_in_earth', label: 'In Earth gravities', unit: 'g' },
          { key: 'v_esc_km_s', label: 'Escape velocity', unit: 'km/s' },
          { key: 'density', label: 'Average density', unit: 'kg/m³' },
        ]}
      />

      <Quiz questions={[
        { q: 'The frost line in the early Solar System was important because:',
          options: ['It set the temperature for liquid water', 'It separated where ices could condense from where they couldn\'t — controlling what solids were available for planet formation', 'It marked the boundary of the asteroid belt', 'It was where Jupiter formed'],
          correct: 1,
          explain: 'The frost line (~3 AU in the early Solar System) is the distance from the Sun beyond which water, methane, and ammonia could condense as ices. This roughly tripled the available solid mass for planet formation, explaining why the outer planets are so much more massive than the inner ones.' },
        { q: 'Why does Saturn have such spectacular rings but Earth doesn\'t?',
          options: ['Saturn has more moons', 'Saturn\'s rings lie inside its Roche limit, where Earth has no equivalent population of material', 'Saturn\'s gravity is stronger', 'Earth\'s atmosphere prevents ring formation'],
          correct: 1,
          explain: 'Inside the Roche limit, tidal forces exceed self-gravity, preventing material from accreting into moons. Saturn happens to have abundant icy material in this zone (probably from a disrupted moon ~100-400 Myr ago). Earth has the Moon outside its Roche limit but no significant population of close-in material.' },
        { q: 'Why is Venus hotter than Mercury despite being further from the Sun?',
          options: ['Venus is more volcanically active', 'Mercury has retrograde rotation', 'Venus has a thick CO₂ atmosphere causing extreme greenhouse warming', 'Mercury\'s polar craters block sunlight'],
          correct: 2,
          explain: 'Venus\'s atmosphere is ~96% CO₂ at 92 bar pressure — a runaway greenhouse effect traps heat. Surface temperature is ~737 K (hotter than Mercury\'s dayside maximum of ~700 K), and it stays at 737 K everywhere on the planet day and night, because the thick atmosphere redistributes heat.' },
      ]} />

      <OpenQuestions items={[
        { q: 'Does Planet Nine exist?',
          detail: '— Multiple extreme trans-Neptunian objects show orbital alignments suggesting gravitational perturbation by an unseen ~5–10 Earth-mass body at ~400–800 AU. Intensive searches (including with the Subaru telescope) have not found it. The Vera C. Rubin Observatory should detect it (if it exists) within a few years of operations.' },
        { q: 'Where did Earth\'s water come from?',
          detail: '— Earth formed dry (inside the frost line). The water must have been delivered later, but by what? D/H isotope ratios from comets are mostly too heavy compared to Earth\'s oceans. Carbonaceous chondrites match better, suggesting most water came from asteroids. But the timing and total contribution remain uncertain.' },
        { q: 'Is there life on Europa, Enceladus, or Mars?',
          detail: '— All three have subsurface (or once-surface) liquid water and the chemistry of life. Europa Clipper (arriving Jupiter 2030) and Dragonfly to Titan (arriving 2034) will start providing data. Mars sample return is planned for ~2033. We may know within 20 years.' },
        { q: 'Why is the Solar System\'s architecture unusual?',
          detail: '— Exoplanet statistics show our system is atypical. We have no super-Earths (the most common planet type in the galaxy); our giant planets are unusually spread out; our small inner planets are unusually small. The current best explanation is the Grand Tack — Jupiter\'s migration in to ~1.5 AU and back out, depleting the inner Solar System.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  17 · HOW TELESCOPES SEE: LIGHT, RESOLUTION & DETECTORS
// ═══════════════════════════════════════════════════════════════════════════

const EM_BANDS = [
  { id: 'radio', name: 'Radio', range: '> 1 mm', lambda: '1 mm – 100 m', E: '< 10⁻³ eV',
    sources: 'Pulsars, neutral hydrogen (21 cm), AGN jets, CMB, masers',
    facilities: 'VLA, ALMA, MeerKAT, FAST, SKA (under construction)',
    note: 'Long wavelengths pass through dust and Earth\'s atmosphere easily. Most radio astronomy is ground-based.',
    atm: 'transparent' },
  { id: 'mm', name: 'Submillimeter / mm', range: '0.3 – 3 mm', lambda: '0.3 – 3 mm', E: '~10⁻³ eV',
    sources: 'Cold dust, molecular clouds, CMB anisotropies, protoplanetary discs',
    facilities: 'ALMA, JCMT, IRAM, SPT',
    note: 'Critical for studying cold gas and planet formation. Requires high dry sites (ALMA is at 5,000 m in Chile).',
    atm: 'partial' },
  { id: 'ir', name: 'Infrared', range: '0.75 – 300 μm', lambda: '0.75 μm – 0.3 mm', E: '~0.001–1 eV',
    sources: 'Cool stars, dust-obscured galaxies, protoplanetary discs, exoplanet atmospheres',
    facilities: 'JWST, Spitzer (retired), ALMA, IRTF, ground-based 8-10m + AO',
    note: 'Penetrates dust that blocks visible light. Mostly absorbed by Earth\'s atmosphere — space telescopes dominate.',
    atm: 'mostly blocked' },
  { id: 'opt', name: 'Visible / Optical', range: '380 – 750 nm', lambda: '380 – 750 nm', E: '~1.5–3 eV',
    sources: 'Stars, galaxies, reflected planetary light, nebulae',
    facilities: 'Hubble, Keck, VLT, Subaru, Gemini, ELT (under construction), Vera Rubin',
    note: 'The atmospheric window we evolved to see in. Where photographic astronomy began and where most discoveries happen.',
    atm: 'transparent' },
  { id: 'uv', name: 'Ultraviolet', range: '10 – 380 nm', lambda: '10 – 380 nm', E: '~3–100 eV',
    sources: 'Hot stars, accretion disks, young stellar populations, ISM',
    facilities: 'Hubble (UV), GALEX (retired), HST/STIS',
    note: 'Blocked by atmospheric ozone — almost all UV astronomy must be space-based.',
    atm: 'mostly blocked' },
  { id: 'xray', name: 'X-ray', range: '0.01 – 10 nm', lambda: '0.01 – 10 nm', E: '~100 eV – 100 keV',
    sources: 'Black holes accreting, neutron stars, hot cluster gas, supernova remnants',
    facilities: 'Chandra, XMM-Newton, NuSTAR, eROSITA, NICER',
    note: 'Blocked entirely by atmosphere. Requires space telescopes with grazing-incidence mirrors (X-rays go through normal mirrors).',
    atm: 'blocked' },
  { id: 'gamma', name: 'Gamma-ray', range: '< 0.01 nm', lambda: '< 0.01 nm', E: '> 100 keV',
    sources: 'Pulsars, AGN, gamma-ray bursts, dark matter (?), pulsars',
    facilities: 'Fermi LAT, INTEGRAL, HESS, MAGIC, CTA (under construction)',
    note: 'No mirrors — gamma rays Compton-scatter or pair-produce in detectors. Space telescopes detect directly; ground arrays detect Cherenkov radiation from cosmic-ray air showers.',
    atm: 'blocked' },
];

function Telescopes({ onBack }) {
  const [tab, setTab] = useState('em');
  const [bandIdx, setBandIdx] = useState(3); // optical default
  const [aperture, setAperture] = useState(8); // meters
  const [wavelength, setWavelength] = useState(550); // nm

  const band = EM_BANDS[bandIdx];

  // Diffraction limit: θ = 1.22 λ/D, returns arcseconds
  const lambda_m = wavelength * 1e-9;
  const theta_rad = 1.22 * lambda_m / aperture;
  const theta_arcsec = theta_rad * 206265;

  // Collecting area scales as D²
  const area = Math.PI * Math.pow(aperture / 2, 2);
  const area_vs_eye = area / Math.PI / Math.pow(0.007 / 2, 2); // dark-adapted eye ~7mm

  return (
    <PageShell onBack={onBack} eyebrow="05 — Light & Instruments"
               title={<>How <em style={{ color: ACCENT, fontStyle: 'italic' }}>Telescopes</em> See</>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        Every fact in astronomy ultimately comes from photons collected, focused, filtered, and counted.
        Behind every spectrum and every distance measurement is a chain of physical machinery — mirrors,
        detectors, electronics — turning faint light into data. Understanding that chain demystifies
        what astronomers actually do.
      </p>

      {/* Tabs */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-px mb-6" style={{ background: BORDER }}>
        {[
          ['em', 'The EM Spectrum'],
          ['resolution', 'Resolution & Aperture'],
          ['detectors', 'Detectors & CCDs'],
          ['techniques', 'Photometry & Spectroscopy'],
          ['frontier', 'Modern Telescopes'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
                  className="p-3 md:p-4 text-center transition"
                  style={{ background: tab === id ? `${ACCENT}15` : BG,
                           borderTop: tab === id ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
            <div className="font-display text-xs md:text-sm" style={{ color: tab === id ? ACCENT : INK, letterSpacing: '-0.01em' }}>{label}</div>
          </button>
        ))}
      </div>

      {tab === 'em' && (
        <div className="fade-in">
          <Section title="One spectrum, seven windows">
            <p>
              Light is a wave of oscillating electric and magnetic fields. The wavelength — the distance
              between crests — varies over more than 15 orders of magnitude across the electromagnetic
              spectrum, from kilometres-long radio waves to picometres-long gamma rays. Each band carries
              different astronomy.
            </p>
            <p>
              What we see with our eyes (380–750 nm) is a narrow slice between ultraviolet and infrared.
              We evolved to detect this band because it's where the Sun is brightest and where Earth's
              atmosphere is transparent. From an astronomical standpoint, it's nearly arbitrary — every
              other band reveals different processes.
            </p>
          </Section>

          <Section title="The atmospheric windows">
            <p>
              Earth's atmosphere is opaque across most wavelengths. Only two main windows are open: the
              <strong style={{ color: ACCENT }}> optical/near-IR window</strong> (~300–1100 nm) and the
              <strong style={{ color: ACCENT }}> radio window</strong> (~1 cm to ~10 m). Almost
              everything else — UV, most of the infrared, X-rays, gamma rays — has to be observed from
              space, or from very high mountains with limited reach.
            </p>
            <p>
              This is why X-ray and UV astronomy didn't exist before the Space Age: there was no way to
              get a telescope above the atmosphere. It's also why high, dry observatories matter so much:
              Mauna Kea (4,200 m), the Atacama Desert (5,000 m), the South Pole. Above most of the water
              vapour, parts of the infrared open up.
            </p>
          </Section>

          <div className="my-8">
            <div className="grid grid-cols-7 gap-px mb-6" style={{ background: BORDER }}>
              {EM_BANDS.map((b, i) => (
                <button key={b.id} onClick={() => setBandIdx(i)}
                        className="p-2 md:p-3 text-center transition"
                        style={{ background: bandIdx === i ? `${ACCENT}10` : BG,
                                 borderTop: bandIdx === i ? `2px solid ${ACCENT}` : `2px solid transparent` }}>
                  <div className="font-display text-[10px] md:text-xs" style={{ color: bandIdx === i ? ACCENT : INK }}>{b.name}</div>
                </button>
              ))}
            </div>

            <div className="fade-in" key={band.id}>
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-display text-2xl" style={{ letterSpacing: '-0.02em' }}>{band.name}</h3>
                <span className="font-mono text-xs uppercase tracking-[0.2em]"
                      style={{ color: band.atm === 'transparent' ? '#7aff7a' : band.atm === 'partial' ? ACCENT : ACCENT3 }}>
                  atmosphere: {band.atm}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-px mb-4" style={{ background: BORDER }}>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Wavelength</div>
                  <div className="font-mono text-sm" style={{ color: INK }}>{band.lambda}</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Photon energy</div>
                  <div className="font-mono text-sm" style={{ color: INK }}>{band.E}</div>
                </div>
                <div className="p-4" style={{ background: BG }}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Sources</div>
                  <div className="font-display text-sm" style={{ color: INK }}>{band.sources}</div>
                </div>
              </div>

              <p className="font-display text-base leading-relaxed mb-3" style={{ color: '#c8c3b1' }}>{band.note}</p>
              <p className="font-mono text-xs" style={{ color: ACCENT }}>Facilities: {band.facilities}</p>
            </div>
          </div>

          <Section title="The same object looks different in every band">
            <p>
              The Crab Nebula in optical: a fuzzy expanding gas cloud. In radio: a synchrotron source from
              the pulsar's wind. In X-rays: a bright torus with collimated jets around the pulsar. In
              gamma rays: pulses every 33 ms from the rapidly rotating neutron star. Same object, five
              different physical pictures, each invisible to the others.
            </p>
            <p>
              This is why modern astronomy is increasingly <strong style={{ color: ACCENT }}>multiwavelength</strong>.
              Real understanding of a galaxy, a supernova remnant, or an accreting black hole requires
              stitching together observations across the spectrum. The same object yields radio (cold gas
              and synchrotron), infrared (dust and obscured star formation), optical (stars and nebulae),
              UV (hot stars and AGN), X-ray (hot gas and accretion), and gamma-ray (relativistic particles)
              data — each constraining different physical processes.
            </p>
          </Section>
        </div>
      )}

      {tab === 'resolution' && (
        <div className="fade-in">
          <Section title="Three things a telescope does">
            <p>
              At its core, a telescope is doing three jobs simultaneously:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>One — collecting area.</strong> The larger the aperture,
              the more photons per second from a given source. The faintest sources detectable scale as
              D² × t (aperture area × exposure time). Doubling the diameter quadruples the light gathered.
              The 10-m Keck telescopes gather ~2 million times more light than a dark-adapted human eye.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Two — angular resolution.</strong> The smallest angular
              detail the telescope can in principle resolve. Set by the
              <Term k="diffraction limit"> diffraction limit</Term>:
            </p>
            <Eq>θ ≈ 1.22 × λ / D    (in radians)</Eq>
            <p>
              Bigger aperture and shorter wavelength give sharper images. A 1-m optical telescope has a
              diffraction limit of ~0.14 arcsec; a 10-m telescope reaches ~0.014 arcsec — in principle.
              In practice atmospheric turbulence blurs ground-based optical telescopes to ~0.5-1 arcsec
              ("<Term k="seeing">seeing</Term>") — much worse than the diffraction limit. This is why
              going to space helps so much.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Three — wavelength coverage.</strong> The optics, detectors,
              and physical design determine which bands you can observe. A radio dish is a totally different
              instrument from an X-ray mirror — they don\'t share components or techniques.
            </p>
          </Section>

          <div className="my-8 p-6 rounded" style={{ border: `1px solid ${ACCENT}30`, background: 'rgba(255, 201, 122, 0.04)' }}>
            <div className="flex items-center gap-3 mb-4"><Pill>interactive</Pill></div>
            <h4 className="font-display text-xl mb-2" style={{ letterSpacing: '-0.01em' }}>Diffraction limit & collecting area</h4>
            <p className="font-display text-sm leading-relaxed mb-6" style={{ color: DIM }}>
              The fundamental tradeoffs of telescope design. Try a 1 m, 2 m, 8 m (VLT), 10 m (Keck), 39 m (ELT), or 100 m (SKA dish).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-display text-sm" style={{ color: INK }}>Aperture diameter (D)</span>
                  <span className="font-mono text-sm" style={{ color: ACCENT }}>{aperture} m</span>
                </div>
                <input type="range" min="0.1" max="100" step="0.1" value={aperture}
                       onChange={e => setAperture(parseFloat(e.target.value))} className="w-full" />
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="font-display text-sm" style={{ color: INK }}>Wavelength (λ)</span>
                  <span className="font-mono text-sm" style={{ color: ACCENT }}>{wavelength < 1000 ? `${wavelength.toFixed(0)} nm` : `${(wavelength/1000).toFixed(1)} μm`}</span>
                </div>
                <input type="range" min="100" max="1000000" step="10"
                       value={Math.log10(wavelength) * 1000}
                       onChange={e => setWavelength(Math.pow(10, parseFloat(e.target.value) / 1000))}
                       className="w-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-px mb-4" style={{ background: BORDER }}>
              <div className="p-3" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Diffraction limit</div>
                <div className="font-mono text-base" style={{ color: ACCENT }}>{theta_arcsec < 1 ? `${(theta_arcsec * 1000).toFixed(1)} mas` : `${theta_arcsec.toFixed(2)}″`}</div>
              </div>
              <div className="p-3" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Collecting area</div>
                <div className="font-mono text-base" style={{ color: INK }}>{area.toFixed(2)} m²</div>
              </div>
              <div className="p-3" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>vs. dark-adapted eye</div>
                <div className="font-mono text-base" style={{ color: INK }}>{area_vs_eye.toExponential(2)}×</div>
              </div>
              <div className="p-3" style={{ background: BG }}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Compare to atm. seeing</div>
                <div className="font-mono text-base" style={{ color: theta_arcsec < 0.5 ? '#7aff7a' : ACCENT3 }}>
                  {theta_arcsec < 0.5 ? 'AO/space-limited' : 'seeing-limited'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-px" style={{ background: BORDER }}>
              {[
                { D: 0.007, λ: 550, label: 'Human eye' },
                { D: 0.2, λ: 550, label: 'Amateur 8″' },
                { D: 2.4, λ: 550, label: 'Hubble' },
                { D: 6.5, λ: 2000, label: 'JWST' },
                { D: 10, λ: 550, label: 'Keck' },
                { D: 39, λ: 550, label: 'ELT (2028)' },
              ].map(p => (
                <button key={p.label} onClick={() => { setAperture(p.D); setWavelength(p.λ); }}
                        className="p-2 text-center transition hover:bg-white/5"
                        style={{ background: BG }}>
                  <div className="font-mono text-xs" style={{ color: ACCENT }}>{p.label}</div>
                  <div className="font-mono text-[10px] mt-1" style={{ color: DIM }}>{p.D} m</div>
                </button>
              ))}
            </div>
          </div>

          <Section title="Seeing and adaptive optics">
            <p>
              On the ground, the atmosphere ruins what big mirrors can in principle achieve. Turbulent
              cells of warm and cool air ~10 cm across cause light from a star to wander randomly,
              creating a "seeing disk" typically 0.5-1 arcsec wide. No matter how big your telescope, in
              traditional imaging you can't resolve finer than that.
            </p>
            <p>
              <Term k="adaptive optics">Adaptive optics</Term> changes that. A deformable mirror
              continuously reshapes itself ~1000 times per second to undo the atmospheric distortion,
              guided by either a bright natural reference star or an artificial laser-generated guide
              star high in the atmosphere. With AO, 8-10m ground-based telescopes can now achieve
              diffraction-limited resolution in the near-IR — actually sharper than Hubble.
            </p>
            <p>
              Combined with extreme AO (high-order systems), this enables direct imaging of exoplanets
              and detailed studies of stellar surfaces, AGN environments, and the supermassive black
              hole at the Galactic centre. Reinhard Genzel and Andrea Ghez shared the 2020 Nobel for
              tracking individual stars orbiting Sgr A* using AO over 25 years.
            </p>
          </Section>

          <Section title="Interferometry: combining apertures">
            <p>
              For radio astronomy, atmospheric distortions are negligible — but radio wavelengths are so
              long that even the largest single dish has poor resolution. The solution:
              <Term k="interferometry"> interferometry</Term>. Combine signals from multiple distant
              telescopes; the effective angular resolution is set by the separation between them, not
              the size of each.
            </p>
            <p>
              The Very Large Array (VLA) in New Mexico uses 27 dishes spread over up to 36 km, achieving
              resolution equivalent to a 36 km dish. ALMA in Chile does the same at millimetre
              wavelengths with 66 dishes. The Event Horizon Telescope linked dishes across continents
              to achieve a baseline of ~10,000 km — enough resolution to image the supermassive black
              holes in M87 and at the Milky Way's centre at angular scales of ~20 μas.
            </p>
            <p>
              Optical interferometry is much harder (shorter wavelengths require holding optical path
              lengths constant to {'<'} 1 micron), but VLT-Interferometer (combining ESO's four 8m dishes)
              and CHARA (Mt. Wilson) have done remarkable work imaging stellar surfaces and close
              binaries.
            </p>
          </Section>
        </div>
      )}

      {tab === 'detectors' && (
        <div className="fade-in">
          <Section title="Before CCDs: the dark ages">
            <p>
              For most of astronomy's history, the detector was the human eye. Galileo, Herschel, and
              Hubble all observed by eye through eyepieces. The eye is remarkably sensitive but has
              terrible quantum efficiency (~10% on a good day), can't integrate light over time (so
              faint sources stay faint), and produces only subjective records.
            </p>
            <p>
              Photographic plates (mid-1800s to mid-1900s) added the ability to integrate — long exposures
              revealed faint nebulae and galaxies invisible to the eye — and created permanent records.
              But plates had quantum efficiency of only ~1-3%. Most photons hitting a plate did nothing.
              Photographic astronomy revealed enormous amounts but was fundamentally inefficient.
            </p>
          </Section>

          <Section title="The CCD revolution">
            <p>
              The <Term k="ccd">Charge-Coupled Device</Term>, invented at Bell Labs in 1969 (Boyle and
              Smith, 2009 Nobel), changed astronomy almost as much as the telescope itself. A CCD is
              a grid of silicon pixels; each photon hitting the silicon liberates a photoelectron via
              the photoelectric effect. The pixels accumulate charge during the exposure; afterwards
              the charge packets are clocked across the chip, amplified, and digitised.
            </p>
            <p>
              Quantum efficiency: ~80-95% across the visible band — 30-50× better than photographic
              plates. Linear response: doubling the exposure doubles the signal. Direct digital output:
              no scanning of plates required. Low dark current and read noise with cooling. For most
              optical astronomy, CCDs are the detector of choice.
            </p>
            <p>
              Modern astronomical CCDs are large (often {'>'} 100 megapixels in a single chip, with mosaics
              of many chips covering large focal planes), cooled to ~−110°C to suppress thermal noise,
              and capable of detecting single photons in faint-source observations. The Vera C. Rubin
              Observatory's 3,200 megapixel camera (largest ever built) is a mosaic of 189 CCD chips
              covering 64 cm — about the size of a beach ball.
            </p>
          </Section>

          <Section title="Detectors at other wavelengths">
            <p>
              <strong style={{ color: ACCENT }}>Near-infrared</strong> (1-5 μm): HgCdTe (mercury cadmium
              telluride) arrays. Used in JWST's NIRCam, ground-based AO imagers. Less mature than CCDs;
              quantum efficiency ~70%.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Mid/far-infrared</strong> (5-200 μm): Si:As (silicon-doped
              arsenic) arrays, bolometers. JWST MIRI uses these. Requires extreme cooling — JWST's MIRI
              operates at 7 K.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Radio</strong>: Coherent receivers (amplifying the wave
              itself before detection). Maintains both amplitude and phase, enabling interferometry.
              Sensitivity limited by noise temperature; best receivers reach ~10 K noise.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>X-ray</strong>: Microcalorimeters (each photon's energy
              measured by tiny temperature rise), CCDs hardened for X-rays, gas proportional counters.
              X-ray "imaging" requires grazing-incidence optics — X-rays only reflect at very shallow
              angles, so X-ray telescopes use nested cylindrical mirrors.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Gamma-ray</strong>: Compton scattering or pair-production
              detection. No focusing possible — gamma rays must be tracked through dense materials. For
              ground-based detection at the highest energies, Cherenkov telescope arrays detect the
              optical flashes produced when gamma rays generate air showers in Earth's atmosphere.
            </p>
          </Section>

          <Section title="What signal-to-noise means">
            <p>
              Astronomical observations are fundamentally about counting photons. If a source produces
              N photons during your exposure, Poisson statistics tell us the uncertainty in N is √N.
              Signal-to-noise (S/N) is N / √N = √N. To detect a faint source, you need enough photons
              that the signal stands out from the noise.
            </p>
            <p>
              Other noise sources add in quadrature: detector read noise (per pixel, per readout),
              dark current (thermal electrons), and sky background (the dominant noise for most ground
              observations of faint sources). The total noise budget determines whether a source is
              detectable in a given exposure.
            </p>
            <Eq>S/N = N_source / √(N_source + N_sky + N_dark + N_read²)</Eq>
            <p>
              In long exposures of faint sources where source counts are small compared to sky, S/N
              grows as √(exposure time). Doubling the exposure improves S/N by √2, not 2×. Quadrupling
              it doubles S/N. Going from a 1-hour exposure to a 100-hour exposure improves your detection
              limit by only 10×. This is why telescope time is so precious and why surveys like Hubble
              Deep Field were so revolutionary.
            </p>
          </Section>
        </div>
      )}

      {tab === 'techniques' && (
        <div className="fade-in">
          <Section title="Two fundamental measurements">
            <p>
              Nearly everything we know about distant objects comes from two basic measurements:
              <Term k="photometry"> photometry</Term> (how much light, in specific wavelength bands) and
              <Term k="spectroscopy"> spectroscopy</Term> (how light intensity varies with wavelength,
              in fine detail). Both have been done for over a century; both continue to be refined.
            </p>
          </Section>

          <Section title="Photometry: light through filters">
            <p>
              You can't reconstruct a full spectrum just by integrating all light in one band — that
              gives a single number per source. But you can measure light through several different
              filters and reconstruct the rough spectral shape.
            </p>
            <p>
              Standard photometric systems define filters with specific transmission curves. The
              UBVRI system (Johnson-Cousins): U (UV, ~365 nm centre), B (blue, ~445 nm), V (visual,
              ~551 nm), R (red, ~658 nm), I (near-IR, ~806 nm). Modern surveys use ugriz (SDSS) or
              other systems. Each filter band gives one number per source — its apparent magnitude in
              that filter.
            </p>
            <p>
              "<strong style={{ color: ACCENT }}>Colour</strong>" in astronomy means the difference
              between magnitudes in two bands: B − V, V − R, etc. Bluer objects have negative B − V;
              redder objects have positive B − V. The Sun has B − V ≈ 0.65 (yellow-ish). Vega has B − V = 0
              (defines the zero by convention). Betelgeuse has B − V ≈ 1.85 (very red).
            </p>
            <p>
              From colours, you can estimate temperature (Wien's law tells you peak emission wavelength),
              redshift (the spectrum shifts redward), interstellar reddening (dust preferentially blocks
              blue light), and even spectral type to within a subclass — all from just a few magnitude
              measurements. This is why photometric surveys can characterise millions of sources at once
              far faster than spectroscopy could.
            </p>
          </Section>

          <Section title="Spectroscopy: dispersing light">
            <p>
              A spectrograph spreads incoming light into its constituent wavelengths using a prism or
              diffraction grating. The result is a 2D image — wavelength along one axis, position along
              the slit along the other. From this you can measure:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Spectral lines</strong> (absorption or emission) →
              chemical composition, temperature, ionisation state, magnetic field strength<br/>
              <strong style={{ color: ACCENT }}>Doppler shifts</strong> in line positions → radial
              velocity, rotation (line broadening from differential motion), turbulence<br/>
              <strong style={{ color: ACCENT }}>Continuum shape</strong> → temperature, reddening<br/>
              <strong style={{ color: ACCENT }}>Cosmological redshift</strong> → distance (for galaxies)
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Spectral resolution</strong> R = λ/Δλ measures how finely
              the spectrograph distinguishes wavelengths. Low-resolution surveys (R ~ 1000) can classify
              stellar types and measure approximate redshifts. High-resolution spectrographs (R ~ 100,000+)
              can measure radial velocities to better than 1 m/s — sufficient to detect Earth-mass
              exoplanets around other stars. ESPRESSO at the VLT reaches R = 200,000.
            </p>
          </Section>

          <Section title="From photons to data: the actual pipeline">
            <p>
              A typical observation goes through many stages between the detector and a publishable
              measurement:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Raw frame</strong> — the CCD readout, contaminated by
              bias offsets, dark current, flat-field variations, cosmic ray hits, bad pixels<br/>
              <strong style={{ color: ACCENT }}>Calibration</strong> — subtract bias and dark frames,
              divide by flat field (image of evenly-illuminated screen) to correct pixel-to-pixel
              sensitivity variations<br/>
              <strong style={{ color: ACCENT }}>Cosmic ray rejection</strong> — identify spurious bright
              pixels from charged-particle hits (combine multiple exposures, or detect outlier shapes)<br/>
              <strong style={{ color: ACCENT }}>Astrometric calibration</strong> — work out which pixel
              corresponds to which celestial coordinate (uses Gaia reference stars)<br/>
              <strong style={{ color: ACCENT }}>Photometric calibration</strong> — convert pixel counts
              to physical fluxes by reference to standard stars<br/>
              <strong style={{ color: ACCENT }}>Source extraction & catalogue</strong> — identify
              individual sources, measure their positions, fluxes, shapes
            </p>
            <p>
              Each stage has its own systematic errors. Real astronomy is as much about understanding
              and controlling these systematics as it is about taking the original data.
            </p>
          </Section>
        </div>
      )}

      {tab === 'frontier' && (
        <div className="fade-in">
          <Section title="The current generation">
            <p>
              <strong style={{ color: ACCENT }}>JWST</strong> (2021–) — 6.5 m segmented mirror at Sun-Earth
              L2, operating 0.6 to 28 μm (mostly infrared). Most powerful astronomical instrument ever
              built. Reaching back to the first galaxies, characterising exoplanet atmospheres,
              transforming what we know about everything.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Hubble</strong> (1990–) — Aging but still highly productive
              2.4-m UV/optical/near-IR telescope. Continues to deliver unique UV science JWST can't do.
              Expected to operate into the 2030s.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>VLT / Keck / Gemini / Subaru</strong> — 8-10m ground-based
              optical/IR telescopes with AO. Workhorses of modern observational astronomy. Combined,
              they observe most known discoveries in followup.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>ALMA</strong> (2013–) — 66-dish millimetre/submillimetre
              interferometer in Chile. Revolutionised understanding of protoplanetary discs, star
              formation, and the cold universe.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Chandra / XMM-Newton</strong> — Major X-ray observatories
              from 1999. Mapping black hole accretion, supernova remnants, cluster gas.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Gaia</strong> (2013–) — All-sky astrometric survey, has
              measured positions, motions, and brightness of ~2 billion stars to microarcsecond precision.
              Fundamental reference frame for everything else.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Vera C. Rubin Observatory</strong> (just starting) — 8.4-m
              survey telescope in Chile. Will image the entire visible sky every 3-4 nights for 10 years.
              Expected to revolutionise time-domain astronomy: transients, asteroids, supernovae, Solar
              System dynamics.
            </p>
          </Section>

          <Section title="The next generation">
            <p>
              <strong style={{ color: ACCENT }}>ELT</strong> (Extremely Large Telescope, first light ~2028)
              — 39-m segmented mirror in Chile. Will be the largest optical/IR telescope ever built.
              Direct imaging of Earth-like exoplanets becomes possible.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>SKA</strong> (Square Kilometre Array, 2027+) — Distributed
              radio telescope array spanning South Africa and Australia. Total collecting area approaching
              1 km². Will revolutionise radio astronomy from cosmology to pulsars to SETI.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Roman Space Telescope</strong> (~2027) — 2.4-m Hubble-class
              telescope but with a wide field 100× Hubble's. Will survey huge sky areas, find ~100,000
              transiting exoplanets, map dark energy via cosmic structure.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>LISA</strong> (~2035) — Space-based gravitational wave
              interferometer with arms 2.5 million km long. Will detect supermassive black hole mergers,
              extreme mass-ratio inspirals, and white-dwarf binaries throughout the Galaxy.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Habitable Worlds Observatory</strong> (~2040s) — proposed
              successor to Hubble/JWST, designed specifically to image and characterise Earth-like
              exoplanets, including hunt for biosignatures.
            </p>
          </Section>

          <Section title="Multi-messenger astronomy">
            <p>
              Astronomy is no longer just about light. Modern observations also detect:
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Cosmic rays</strong> — high-energy particles from
              supernovae and AGN. Detected for over a century; origins still partially mysterious.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Neutrinos</strong> — IceCube (cubic km of Antarctic ice
              instrumented with photomultipliers) detected the first astrophysical neutrinos from
              blazar TXS 0506+056 in 2017. Solar neutrinos are routinely detected. Supernova SN 1987A
              produced detectable neutrinos.
            </p>
            <p>
              <strong style={{ color: ACCENT }}>Gravitational waves</strong> — LIGO and Virgo have now
              detected ~100 binary mergers (black holes, neutron stars). GW170817 (a neutron-star merger)
              was observed in both gravitational waves and across the entire EM spectrum — the first
              "multi-messenger" detection.
            </p>
            <p>
              Each new "messenger" opens fundamentally new astronomy. The combination of EM, neutrinos,
              and gravitational waves is the new frontier — and the 2030s will likely see all three
              becoming routine.
            </p>
          </Section>
        </div>
      )}

      <WorkedExample title="Can the ELT image an Earth-like exoplanet directly?"
                     steps={[
                       { text: 'Earth around the Sun is at 1 AU. The closest Sun-like star is α Centauri A at ~1.3 pc (~4.3 ly). What angular separation does an Earth-analog at 1 AU around α Cen A subtend from Earth?',
                         eq: 'θ = 1 AU / 1.3 pc = 1 / (1.3 × 206265) AU ≈ 3.7 × 10⁻⁶ rad ≈ 0.77 arcsec' },
                       { text: 'The ELT has a 39 m aperture. At 800 nm (near-IR), the diffraction limit is:',
                         eq: 'θ_diff = 1.22 × 800e−9 / 39 ≈ 2.5e−8 rad ≈ 0.0052 arcsec' },
                       { text: 'So the ELT can in principle resolve features 150× finer than the planet-star separation. The "resolution" isn\'t the limitation. The actual challenge is contrast.',
                         eq: 'Contrast: planet/star flux ratio ~10⁻¹⁰ in reflected light' },
                       { text: 'A coronagraph blocks the star\'s light; advanced AO further suppresses residual scattered starlight. State-of-the-art is ~10⁻⁷ contrast at 0.5 arcsec. Reaching 10⁻¹⁰ requires another factor of ~1000.',
                         answer: 'ELT can probably image young, hot, self-luminous Jupiters around nearby stars (already done at 8m). Imaging an Earth-analog requires ~10⁻¹⁰ contrast — extremely difficult but possibly achievable for the brightest, closest cases. The Habitable Worlds Observatory is specifically designed for this. ELT will demonstrate the techniques; HWO will do the science.' },
                     ]} />

      <Quiz questions={[
        { q: 'The diffraction limit of a telescope is set primarily by:',
          options: ['Atmospheric seeing', 'Aperture diameter and wavelength', 'Detector sensitivity', 'Distance to the source'],
          correct: 1,
          explain: 'θ ≈ 1.22 λ/D. The diffraction limit is a fundamental property of wave physics, set entirely by the aperture and the wavelength. Atmospheric seeing degrades real ground-based performance below this limit; adaptive optics partially restore it.' },
        { q: 'Why are X-ray telescopes built so differently from optical telescopes?',
          options: ['X-rays don\'t carry energy', 'X-rays pass through normal mirrors — must use grazing-incidence optics', 'X-rays are too faint', 'X-rays don\'t come from space'],
          correct: 1,
          explain: 'X-rays only reflect off mirrors at very shallow grazing angles (otherwise they pass through). X-ray telescopes use nested cylindrical mirrors that bounce X-rays through small angles to a focal point. This makes them fundamentally different from the parabolic mirrors used for visible light.' },
        { q: 'Going from a 4-hour exposure to a 100-hour exposure improves S/N by approximately:',
          options: ['25×', '5×', '2.5×', 'Negligible improvement'],
          correct: 1,
          explain: 'S/N grows as √(exposure time). √(100/4) = √25 = 5. The Hubble Deep Field famously used a ~100-hour exposure to reach extremely faint sources — but doubling that to 200 hours would have improved S/N by only ~1.4×.' },
        { q: 'A photometric system measures an object\'s brightness in:',
          options: ['Different wavelength filters', 'Different angular positions', 'Different times', 'Different polarisations'],
          correct: 0,
          explain: 'Photometry measures total light through specific filters (e.g. UBVRI, ugriz). The differences between filter measurements ("colours") encode information about temperature, redshift, and reddening — making photometry an efficient way to characterise large numbers of sources without full spectroscopy.' },
      ]} />

      <TryThis title="Engage with real telescope data"
               items={[
                 { title: 'Browse JWST images at stsci.edu', text: 'The MAST archive (mast.stsci.edu) hosts every publicly released JWST observation. You can download raw and reduced data, browse images of nearby galaxies, distant cosmic dawn, exoplanet atmospheres. Most professional analysis starts here.', gear: 'Browser' },
                 { title: 'Use Aladin Sky Atlas', text: 'aladin.cds.unistra.fr - a free interactive sky atlas. Click any region and see overlaid images from optical (SDSS, DSS), infrared (2MASS, WISE), X-ray (ROSAT), radio (NVSS). Same object, every wavelength. Strikingly different pictures.', gear: 'Browser' },
                 { title: 'Calculate signal-to-noise for a hypothetical observation', text: 'Use the ESO Exposure Time Calculator (eso.org/observing/etc) to plan an observation. Try: 1-hour VLT exposure of a 22nd-mag galaxy. The calculator will tell you what S/N you\'ll achieve — and lets you experiment with seeing, airmass, moon phase.', gear: 'Browser' },
                 { title: 'See ALMA images of protoplanetary discs', text: 'almaobservatory.org has stunning images of planet-forming discs around young stars — actual current images of solar system formation in progress. The gaps in HL Tauri\'s disc are very plausibly forming planets.', gear: 'Browser' },
               ]} />

      <OpenQuestions items={[
        { q: 'Can we find biosignatures with the next generation of telescopes?',
          detail: '— The Habitable Worlds Observatory is designed specifically to spectroscopically characterise exoplanet atmospheres looking for O₂ + CH₄, water vapour, methane and other signatures. Whether biosignatures could be definitively distinguished from abiotic processes remains an active question.' },
        { q: 'How do we detect Earth-mass planets around Sun-like stars?',
          detail: '— Earth produces a 9 cm/s radial-velocity wobble in the Sun. The best spectrographs reach ~50 cm/s. Closing the gap requires extreme precision and stellar-activity modelling. The Roman Space Telescope and the ELT instruments are designed to push toward this limit.' },
        { q: 'What\'s next after gravitational waves?',
          detail: '— Multi-messenger astronomy combining EM, gravitational waves, and neutrinos is an emerging area. The 2030s will see LISA, CTA (very-high-energy gamma rays), IceCube-Gen2, and HWO all coming online — possibly enabling entirely new science from yet-undiscovered classes of source.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  18 · THE STANDARD MODEL OF PARTICLE PHYSICS
// ═══════════════════════════════════════════════════════════════════════════

const PARTICLES = {
  // Up-type quarks (charge +2/3)
  u: {
    symbol: 'u', name: 'Up quark', kind: 'quark', subtype: 'up-type', gen: 1,
    mass: '2.2 MeV/c²', charge: '+2/3', spin: '½', colour: 'r, g, or b',
    discovered: '1968 — SLAC deep inelastic scattering',
    desc: 'The lightest quark and one of the two building blocks of ordinary matter. A proton contains two up quarks and one down quark (uud). The up quark itself is never seen alone — quarks are permanently confined inside hadrons by the strong force.',
    fact: 'You\'re mostly made of up quarks. Every atomic nucleus is built from up and down quarks.'
  },
  c: {
    symbol: 'c', name: 'Charm quark', kind: 'quark', subtype: 'up-type', gen: 2,
    mass: '1.27 GeV/c²', charge: '+2/3', spin: '½', colour: 'r, g, or b',
    discovered: '1974 — BNL & SLAC (the "November Revolution")',
    desc: 'The second-generation up-type quark. Its discovery as the J/ψ meson (a charm-anticharm bound state) by two independent groups simultaneously was so dramatic it forced the entire physics community to accept the quark model overnight.',
    fact: 'The simultaneous discovery is one of the most famous events in particle physics.'
  },
  t: {
    symbol: 't', name: 'Top quark', kind: 'quark', subtype: 'up-type', gen: 3,
    mass: '173 GeV/c²', charge: '+2/3', spin: '½', colour: 'r, g, or b',
    discovered: '1995 — Fermilab Tevatron',
    desc: 'The heaviest known elementary particle — about as massive as a tungsten atom. It decays so fast (~5 × 10⁻²⁵ s) that it never has time to form hadrons. The top is the only quark we observe "bare" rather than bound inside a composite particle.',
    fact: 'Its huge mass means it couples most strongly of any particle to the Higgs field — making it a key probe of new physics.'
  },
  // Down-type quarks (charge −1/3)
  d: {
    symbol: 'd', name: 'Down quark', kind: 'quark', subtype: 'down-type', gen: 1,
    mass: '4.7 MeV/c²', charge: '−1/3', spin: '½', colour: 'r, g, or b',
    discovered: '1968 — SLAC deep inelastic scattering',
    desc: 'The other building block of ordinary matter. A neutron contains two down quarks and one up quark (udd). Beta decay is fundamentally a down quark transforming into an up quark via W boson emission.',
    fact: 'Slightly heavier than the up quark — this small mass difference is why free neutrons decay but free protons don\'t.'
  },
  s: {
    symbol: 's', name: 'Strange quark', kind: 'quark', subtype: 'down-type', gen: 2,
    mass: '93 MeV/c²', charge: '−1/3', spin: '½', colour: 'r, g, or b',
    discovered: '1947 — cosmic ray studies (kaons)',
    desc: 'Found in unusual cosmic-ray events from the 1940s, hence "strange". Particles containing strange quarks (like kaons) live unexpectedly long because the weak interaction is required to change strangeness.',
    fact: 'CP violation was first observed in kaon decays in 1964 — a small hint at the matter-antimatter asymmetry of the universe.'
  },
  b: {
    symbol: 'b', name: 'Bottom quark', kind: 'quark', subtype: 'down-type', gen: 3,
    mass: '4.18 GeV/c²', charge: '−1/3', spin: '½', colour: 'r, g, or b',
    discovered: '1977 — Fermilab (the Υ meson)',
    desc: 'The down-type quark of the third generation. B-mesons (containing a bottom quark) exhibit the cleanest measurable CP violation, and B-meson factories like LHCb and Belle II study them intensively.',
    fact: 'Some physicists prefer to call it the "beauty" quark, but "bottom" stuck.'
  },
  // Charged leptons (charge −1)
  e: {
    symbol: 'e⁻', name: 'Electron', kind: 'lepton', subtype: 'charged', gen: 1,
    mass: '0.511 MeV/c²', charge: '−1', spin: '½', colour: 'none',
    discovered: '1897 — J.J. Thomson',
    desc: 'The first elementary particle ever discovered. Stable, abundant, and responsible for all of chemistry. Orbits atomic nuclei via the electromagnetic force.',
    fact: 'Every electron in the universe is identical to every other — there\'s no way to tell them apart, even in principle.'
  },
  mu: {
    symbol: 'μ⁻', name: 'Muon', kind: 'lepton', subtype: 'charged', gen: 2,
    mass: '105.7 MeV/c²', charge: '−1', spin: '½', colour: 'none',
    discovered: '1936 — Anderson & Neddermeyer (cosmic rays)',
    desc: 'A heavier copy of the electron, ~207 times more massive. Lives only 2.2 microseconds at rest before decaying to an electron plus two neutrinos. "Who ordered that?" — Isidor Rabi, on hearing about the muon\'s discovery.',
    fact: 'Cosmic-ray muons time-dilate enough to reach Earth\'s surface despite their short lifetime — confirming special relativity daily.'
  },
  tau: {
    symbol: 'τ⁻', name: 'Tau', kind: 'lepton', subtype: 'charged', gen: 3,
    mass: '1.777 GeV/c²', charge: '−1', spin: '½', colour: 'none',
    discovered: '1975 — Martin Perl at SLAC',
    desc: 'The heaviest lepton, ~3,500× more massive than the electron. So heavy it can decay into hadrons (not just lighter leptons). Lifetime: 2.9 × 10⁻¹³ s.',
    fact: 'Discovery completed the third generation of leptons and earned Perl the 1995 Nobel Prize.'
  },
  // Neutrinos (charge 0)
  ve: {
    symbol: 'νₑ', name: 'Electron neutrino', kind: 'lepton', subtype: 'neutrino', gen: 1,
    mass: '< 0.8 eV/c²', charge: '0', spin: '½', colour: 'none',
    discovered: '1956 — Cowan & Reines (Savannah River reactor)',
    desc: 'Predicted by Pauli in 1930 to save energy conservation in beta decay; detected 26 years later. Almost massless and barely interacts — ~100 trillion solar neutrinos pass through your body every second, mostly without effect.',
    fact: 'Neutrinos detected from SN 1987A arrived before the visible supernova light, because they escape the dense core before photons can.'
  },
  vmu: {
    symbol: 'ν_μ', name: 'Muon neutrino', kind: 'lepton', subtype: 'neutrino', gen: 2,
    mass: '< 0.19 MeV/c²', charge: '0', spin: '½', colour: 'none',
    discovered: '1962 — Lederman, Schwartz & Steinberger (BNL)',
    desc: 'Distinct from the electron neutrino — the discovery established that there were multiple neutrino "flavours". Produced mostly in particle decays involving muons (e.g. pion decay).',
    fact: 'Neutrinos oscillate between flavours as they travel, meaning they must have mass — first solid confirmation came from Super-K in 1998.'
  },
  vtau: {
    symbol: 'ν_τ', name: 'Tau neutrino', kind: 'lepton', subtype: 'neutrino', gen: 3,
    mass: '< 18.2 MeV/c²', charge: '0', spin: '½', colour: 'none',
    discovered: '2000 — DONUT experiment at Fermilab',
    desc: 'The last fermion to be directly detected. Predicted in the 1970s but extraordinarily hard to identify because of how rarely it interacts.',
    fact: 'Of the trillions of solar neutrinos passing through Earth every second, you\'d expect on average ~1 to be a tau neutrino — and you\'d still need a 1-kiloton detector to catch it.'
  },
  // Gauge bosons
  photon: {
    symbol: 'γ', name: 'Photon', kind: 'gauge', subtype: 'electromagnetic', gen: '—',
    mass: '0 (exactly)', charge: '0', spin: '1', colour: 'none',
    discovered: '1905 — Einstein (theory); 1923 — Compton (experiment)',
    desc: 'The quantum of the electromagnetic field. Carries the electromagnetic force between charged particles. Massless and travels at exactly c.',
    fact: 'Every photon you\'ve ever seen reaching your eye was created by an electron transitioning to a lower energy state somewhere — usually in the Sun.'
  },
  gluon: {
    symbol: 'g', name: 'Gluon', kind: 'gauge', subtype: 'strong', gen: '—',
    mass: '0 (theoretically)', charge: '0', spin: '1', colour: 'colour + anticolour',
    discovered: '1979 — PETRA (DESY) three-jet events',
    desc: 'Carries the strong force binding quarks. Unlike the photon, gluons themselves carry colour charge (eight types exist), which is why they interact with each other and why the strong force gets STRONGER with distance — leading to quark confinement.',
    fact: 'You can never have a single isolated gluon — like quarks, they\'re confined inside hadrons.'
  },
  W: {
    symbol: 'W±', name: 'W boson', kind: 'gauge', subtype: 'weak', gen: '—',
    mass: '80.4 GeV/c²', charge: '±1', spin: '1', colour: 'none',
    discovered: '1983 — UA1 & UA2 at CERN SPS',
    desc: 'Carries the charged-current weak force responsible for beta decay and most particle transformations. Comes in W⁺ and W⁻ varieties. Its huge mass (~85× the proton) makes the weak force short-range and weak at low energies.',
    fact: 'Rubbia and Van der Meer shared the 1984 Nobel for the W and Z discoveries — barely a year after the experimental detection.'
  },
  Z: {
    symbol: 'Z⁰', name: 'Z boson', kind: 'gauge', subtype: 'weak', gen: '—',
    mass: '91.2 GeV/c²', charge: '0', spin: '1', colour: 'none',
    discovered: '1983 — UA1 & UA2 at CERN SPS',
    desc: 'Carries the neutral-current weak force. Predicted in the 1960s and confirmed via neutrino scattering before direct detection in 1983. Like the W, its huge mass restricts the weak force to subatomic ranges.',
    fact: 'The Z\'s decay width (how rapidly it decays) precisely constrains the number of light neutrino flavours to 3 — there are no more.'
  },
  // Scalar boson
  H: {
    symbol: 'H', name: 'Higgs boson', kind: 'higgs', subtype: 'scalar', gen: '—',
    mass: '125.1 GeV/c²', charge: '0', spin: '0', colour: 'none',
    discovered: '2012 — ATLAS & CMS at CERN LHC',
    desc: 'The quantum of the Higgs field. Discovered after a 48-year search — Peter Higgs first proposed it in 1964. The Higgs field permeates all space; particles gain mass by interacting with it. Higgs and Englert won the 2013 Nobel Prize.',
    fact: 'The Higgs is the only known fundamental scalar (spin-0) particle. Why its mass is "only" ~125 GeV — rather than the Planck scale (~10¹⁹ GeV) — is the hierarchy problem and remains unexplained.'
  },
};

// Helper to render colour-coded badges based on particle kind
function particleColour(kind) {
  if (kind === 'quark') return '#ff8a70';
  if (kind === 'lepton') return '#7ac4ff';
  if (kind === 'gauge') return '#ffc97a';
  if (kind === 'higgs') return '#c79bff';
  return DIM;
}

function StandardModel({ onBack }) {
  const [selected, setSelected] = useState('e');
  const p = PARTICLES[selected];

  // The grid layout: rows are particle type, columns are generation + bosons
  // Row 1: up-type quarks
  // Row 2: down-type quarks
  // Row 3: charged leptons
  // Row 4: neutrinos
  // Right column / extra: gauge bosons and Higgs
  const grid = [
    [{ id: 'u', label: 'u', name: 'up' },     { id: 'c', label: 'c', name: 'charm' },   { id: 't', label: 't', name: 'top' },    { id: 'gluon',  label: 'g', name: 'gluon' }],
    [{ id: 'd', label: 'd', name: 'down' },   { id: 's', label: 's', name: 'strange' }, { id: 'b', label: 'b', name: 'bottom' }, { id: 'photon', label: 'γ', name: 'photon' }],
    [{ id: 'e', label: 'e', name: 'electron' }, { id: 'mu', label: 'μ', name: 'muon' },   { id: 'tau', label: 'τ', name: 'tau' }, { id: 'Z', label: 'Z', name: 'Z boson' }],
    [{ id: 've', label: 'νₑ', name: 'e neutrino' }, { id: 'vmu', label: 'ν_μ', name: 'μ neutrino' }, { id: 'vtau', label: 'ν_τ', name: 'τ neutrino' }, { id: 'W', label: 'W', name: 'W boson' }],
  ];

  return (
    <PageShell onBack={onBack} eyebrow="18 — Fundamental Particles"
               title={<>The Standard <em style={{ color: ACCENT, fontStyle: 'italic' }}>Model</em></>}>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-3" style={{ color: '#c8c3b1' }}>
        Every electron, every photon, every quark inside every proton in your body, every neutrino
        streaming from the Sun — they're all described by a single theory developed over the second
        half of the twentieth century. The
        <Term k="standard model"> Standard Model</Term> contains just 17 fundamental particles and three
        of the four known forces. From these ingredients alone, it predicts experimental outcomes to
        accuracies of one part in a billion.
      </p>
      <p className="font-display text-lg max-w-3xl leading-relaxed mb-10" style={{ color: '#c8c3b1' }}>
        It is also famously incomplete: it doesn't include gravity, has nothing to say about dark
        matter, can't fully explain why the universe is made of matter rather than antimatter, and
        contains roughly 20 free parameters that have to be measured rather than derived. Despite that,
        it is the most precise scientific theory ever constructed.
      </p>

      <Section title="The whole zoo on one page">
        <p>
          Click any particle to see its properties and story. <span style={{ color: '#ff8a70' }}>Orange</span> tiles are
          <Term k="quark"> quarks</Term> (the only particles that feel the strong force);
          <span style={{ color: '#7ac4ff' }}> blue</span> tiles are
          <Term k="lepton"> leptons</Term> (electrons, muons, taus, and the three neutrinos);
          <span style={{ color: ACCENT }}> yellow</span> tiles are the
          <Term k="gauge boson"> gauge bosons</Term> (force carriers); the
          <span style={{ color: '#c79bff' }}> violet</span> tile is the
          <Term k="higgs boson"> Higgs</Term>, which gives mass to everything else.
        </p>
        <p>
          The three vertical columns of fermions (quarks + leptons) are the three "generations" of
          matter. Each successive generation is heavier than the last, otherwise identical. Why three?
          Nobody knows.
        </p>
      </Section>

      {/* The interactive grid */}
      <div className="my-8">
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-center pb-2" style={{ color: DIM }}>Generation I</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-center pb-2" style={{ color: DIM }}>Generation II</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-center pb-2" style={{ color: DIM }}>Generation III</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-center pb-2" style={{ color: DIM }}>Gauge Bosons</div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {grid.flat().map((cell) => {
            const part = PARTICLES[cell.id];
            const isSelected = selected === cell.id;
            const col = particleColour(part.kind);
            return (
              <button key={cell.id}
                      onClick={() => setSelected(cell.id)}
                      className="aspect-square transition-all relative overflow-hidden"
                      style={{
                        background: isSelected ? `${col}25` : '#0e1018',
                        border: `1px solid ${isSelected ? col : BORDER}`,
                        outline: isSelected ? `1px solid ${col}` : 'none',
                      }}>
                <div className="absolute top-2 left-2 font-mono text-[9px] uppercase tracking-[0.15em]"
                     style={{ color: isSelected ? col : DIM }}>
                  {part.kind === 'quark' ? 'quark' : part.kind === 'lepton' ? 'lepton' : part.kind === 'gauge' ? 'boson' : 'higgs'}
                </div>
                <div className="absolute top-2 right-2 font-mono text-[9px]" style={{ color: DIM }}>
                  {part.charge}
                </div>
                <div className="flex items-center justify-center h-full">
                  <div className="font-display text-3xl md:text-4xl"
                       style={{ color: isSelected ? col : INK, letterSpacing: '-0.02em' }}>
                    {cell.label}
                  </div>
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-[0.1em]"
                     style={{ color: isSelected ? col : DIM }}>
                  {cell.name}
                </div>
                <div className="absolute bottom-7 left-0 right-0 text-center font-mono text-[8px]"
                     style={{ color: FAINT }}>
                  {part.mass}
                </div>
              </button>
            );
          })}
        </div>

        {/* Higgs sits separately */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div></div>
          <div></div>
          <div></div>
          <button onClick={() => setSelected('H')}
                  className="aspect-square transition-all relative overflow-hidden"
                  style={{
                    background: selected === 'H' ? '#c79bff25' : '#0e1018',
                    border: `1px solid ${selected === 'H' ? '#c79bff' : BORDER}`,
                    outline: selected === 'H' ? `1px solid #c79bff` : 'none',
                  }}>
            <div className="absolute top-2 left-2 font-mono text-[9px] uppercase tracking-[0.15em]"
                 style={{ color: selected === 'H' ? '#c79bff' : DIM }}>scalar</div>
            <div className="absolute top-2 right-2 font-mono text-[9px]" style={{ color: DIM }}>0</div>
            <div className="flex items-center justify-center h-full">
              <div className="font-display text-3xl md:text-4xl"
                   style={{ color: selected === 'H' ? '#c79bff' : INK, letterSpacing: '-0.02em' }}>H</div>
            </div>
            <div className="absolute bottom-2 left-0 right-0 text-center font-mono text-[9px] uppercase tracking-[0.1em]"
                 style={{ color: selected === 'H' ? '#c79bff' : DIM }}>Higgs</div>
            <div className="absolute bottom-7 left-0 right-0 text-center font-mono text-[8px]" style={{ color: FAINT }}>125.1 GeV/c²</div>
          </button>
        </div>

        {/* Detail card for selected particle */}
        <div className="mt-6 p-6 fade-in" key={selected}
             style={{ border: `1px solid ${particleColour(p.kind)}40`, background: `${particleColour(p.kind)}08` }}>
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-baseline gap-4">
              <span className="font-display text-5xl" style={{ color: particleColour(p.kind), letterSpacing: '-0.02em' }}>{p.symbol}</span>
              <div>
                <h3 className="font-display text-2xl" style={{ letterSpacing: '-0.02em' }}>{p.name}</h3>
                <div className="font-mono text-xs uppercase tracking-[0.2em] mt-1" style={{ color: DIM }}>
                  {p.kind === 'gauge' ? `${p.subtype} force carrier` : p.kind === 'higgs' ? 'scalar boson' : `${p.subtype} ${p.kind}, generation ${p.gen}`}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-px mb-5" style={{ background: BORDER }}>
            <div className="p-3" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Mass</div>
              <div className="font-mono text-sm" style={{ color: INK }}>{p.mass}</div>
            </div>
            <div className="p-3" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Electric charge</div>
              <div className="font-mono text-sm" style={{ color: INK }}>{p.charge}</div>
            </div>
            <div className="p-3" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Spin</div>
              <div className="font-mono text-sm" style={{ color: INK }}>{p.spin}</div>
            </div>
            <div className="p-3" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Colour charge</div>
              <div className="font-mono text-sm" style={{ color: INK }}>{p.colour}</div>
            </div>
            <div className="p-3" style={{ background: BG }}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: DIM }}>Discovered</div>
              <div className="font-mono text-xs" style={{ color: INK }}>{p.discovered}</div>
            </div>
          </div>

          <p className="font-display text-base leading-relaxed mb-3" style={{ color: '#c8c3b1' }}>{p.desc}</p>
          <p className="font-display text-sm leading-relaxed italic" style={{ color: DIM }}>{p.fact}</p>
        </div>
      </div>

      <Section title="What makes a particle fundamental?">
        <p>
          A "fundamental" particle in the Standard Model has no known internal structure. Every test we
          can perform — at the highest collision energies we can produce — sees them as point-like
          objects with no measurable size. This is in contrast to <em>composite</em> particles:
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Protons and neutrons</strong> are not fundamental — they're
          made of three quarks each, bound by gluons. <strong style={{ color: ACCENT }}>Atoms</strong>
          are not fundamental — they're a nucleus (protons + neutrons) plus electrons.
          <strong style={{ color: ACCENT }}> Mesons</strong> (pions, kaons, J/ψ, B-mesons) are quark-antiquark pairs.
          All of these are bound states of fundamental particles.
        </p>
        <p>
          The 17 particles in the grid above are, as far as we can currently tell, the actual end of the
          reductionist line. Whether they really have no substructure, or whether deeper physics will
          reveal them as composites of even more elementary objects (preons? strings?), remains open.
        </p>
      </Section>

      <Section title="Three generations of matter">
        <p>
          The fermions (matter particles) come in three families, called "generations". Each generation
          has exactly two quarks (one up-type, one down-type), one charged lepton, and one neutrino.
          Within each row of the grid, the particles in successive columns are heavier copies of the
          same thing.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Generation I</strong> (up, down, electron, electron neutrino)
          contains everything that makes up stable matter. All ordinary atoms are first-generation.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Generations II and III</strong> (charm/strange/muon/μ-neutrino,
          and top/bottom/tau/τ-neutrino) are unstable. They appear briefly in cosmic-ray collisions, in
          particle accelerators, and in the early universe — but their components decay quickly back to
          first-generation particles.
        </p>
        <p>
          Why three? It's one of the great mysteries of physics. Three is the minimum needed for CP
          violation (and thus the matter-antimatter asymmetry), but nothing in the Standard Model forbids
          a fourth generation. Experiment has ruled out a fourth <em>light</em> neutrino with great
          precision (from Z boson decay width), but that doesn't rule out heavier sequential generations
          completely.
        </p>
      </Section>

      <Section title="The four forces (well, three)">
        <p>
          The Standard Model describes three of the four known fundamental forces:
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Electromagnetism</strong> (carried by the photon, γ) — Acts on
          electric charge. Long-range (1/r²). Responsible for chemistry, light, magnets, friction,
          electronics. The photon is massless, which is why EM forces reach to infinity.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>The strong force</strong> (carried by gluons, g) — Acts on
          colour charge. Binds quarks into protons and neutrons; binds nucleons into nuclei. Counterintuitively
          gets STRONGER with distance — pull two quarks apart and you eventually produce a new quark-antiquark
          pair rather than separate them. This is <em>confinement</em>.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>The weak force</strong> (carried by W and Z bosons) — Responsible
          for beta decay, neutrino interactions, and almost all particle transformations. Short-range
          (~10⁻¹⁸ m) because the W and Z are extraordinarily heavy (~80–91 GeV). Despite being called
          "weak", it is actually comparable in strength to EM at very short distances — it's the heavy
          force carriers that make it appear weak at human scales.
        </p>
        <p>
          <strong style={{ color: ACCENT3 }}>Gravity</strong> — Not in the Standard Model. We have no
          consistent quantum theory of gravity. A hypothetical "graviton" would carry it, but has never
          been detected and gravity is so weak at quantum scales that direct detection of individual
          gravitons may be permanently impossible. Reconciling quantum mechanics with general relativity
          is the deepest unsolved problem in fundamental physics.
        </p>
      </Section>

      <Section title="The Higgs: where mass comes from">
        <p>
          For most of the 20th century, particle physicists assumed mass was just an intrinsic property of
          each particle — a number you measured but didn't try to explain. In 1964, six theorists
          (independently, in three groups: Higgs; Englert & Brout; Guralnik, Hagen & Kibble) proposed
          something stranger: an invisible field fills all of space, and particles get their mass by
          interacting with it.
        </p>
        <p>
          The
          <Term k="higgs boson"> Higgs field</Term> is fundamentally different from other fields. Most
          fields are zero in empty space (and excited above zero where particles exist). The Higgs field
          has a <em>nonzero</em> value everywhere, even in vacuum. The strength of a particle's coupling
          to this background field determines its mass:
        </p>
        <Eq>m_particle = (Higgs coupling strength) × (Higgs vacuum value, ~246 GeV)</Eq>
        <p>
          A top quark couples strongly → 173 GeV. An electron couples weakly → 0.5 MeV (~350,000× less).
          A photon doesn't couple at all → exactly zero mass. The Higgs field gives a natural origin for
          masses but doesn't predict the coupling strengths — those still have to be measured.
        </p>
        <p>
          The Higgs <em>boson</em>, the particle, is the quantum excitation of the Higgs field. Detecting
          it required the Large Hadron Collider — colliding protons at 13 TeV until enough Higgs bosons
          were produced (and decayed in distinctive ways) to be unambiguously identified. The 2012
          discovery completed the Standard Model. Higgs and Englert shared the 2013 Nobel Prize. (Brout
          had died in 2011; the Nobel is not awarded posthumously.)
        </p>
      </Section>

      <Section title="Antimatter and CP violation">
        <p>
          Every fermion in the Standard Model has an
          <Term k="antimatter"> antiparticle</Term>: same mass, opposite charge (and opposite "colour"
          if applicable). The electron's antiparticle is the positron (e⁺); the up quark's antiparticle
          is the anti-up (ū). Some neutral particles (the photon, the Z boson, the Higgs) are their own
          antiparticles. Whether neutrinos are their own antiparticles (Majorana fermions) is currently
          unknown.
        </p>
        <p>
          The big puzzle: matter and antimatter should have been produced in equal amounts at the Big
          Bang, but they aren't equal now. The visible universe is overwhelmingly matter, with a
          baryon-to-photon ratio of ~10⁻⁹. Where did the antimatter go?
        </p>
        <p>
          Andrei Sakharov in 1967 identified three conditions necessary to produce a matter excess:
          (1) baryon number must not be conserved, (2) <Term k="cp violation">CP-symmetry violation</Term>
          must occur, and (3) interactions must depart from thermal equilibrium. CP violation HAS been
          observed in the Standard Model — first in kaon decays (1964), then in B-mesons and D-mesons.
          But the amount predicted by the Standard Model is too small by ~10¹⁰ to account for the actual
          matter excess.
        </p>
        <p>
          Either there's CP violation outside the Standard Model (a major motivation for searching for
          new physics in B-meson decays and neutrino oscillation), or the matter asymmetry was set by
          some other early-universe mechanism we don't yet understand.
        </p>
      </Section>

      <Section title="What the Standard Model cannot explain">
        <p>
          For all its precision, the Standard Model has gaping holes:
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Gravity.</strong> Not included at all. We have general relativity
          for gravity at macroscopic scales, but no working quantum theory. Reconciling them requires
          new physics — strings, loop quantum gravity, asymptotic safety, or something else entirely.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Dark matter.</strong> ~27% of the universe, gravitationally
          detected, made of something the Standard Model doesn't contain. WIMPs (Weakly Interacting
          Massive Particles), axions, sterile neutrinos, and primordial black holes are leading candidates.
          No direct laboratory detection despite 40 years of trying.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Dark energy.</strong> ~68% of the universe, driving accelerating
          cosmic expansion. The simplest explanation is Einstein's cosmological constant Λ, but its value
          is wrong by ~120 orders of magnitude compared to naive quantum-field-theory estimates. The
          cosmological constant problem is arguably the worst theoretical prediction in the history of
          physics.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Neutrino masses.</strong> The Standard Model originally
          predicted neutrinos to be massless. Observations of neutrino flavour oscillation (Super-K
          1998, SNO 2001 — 2015 Nobel) showed they have small but nonzero masses, requiring an extension
          of the original theory.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Matter-antimatter asymmetry.</strong> CP violation in the
          Standard Model is too small to explain the observed matter dominance, as discussed above.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>The hierarchy problem.</strong> Why is the Higgs mass
          (~125 GeV) so much smaller than the Planck mass (~10¹⁹ GeV)? Naive quantum corrections should
          make it enormous; something must cancel them. Supersymmetry was the leading proposed
          explanation but has not been found at the LHC.
        </p>
        <p>
          <strong style={{ color: ACCENT }}>Three generations.</strong> Why three? Why these specific
          masses? Why these specific mixing patterns? The Standard Model just contains these as input
          parameters.
        </p>
      </Section>

      <Playground
        title="Particle Compton wavelength and energy"
        description="The Compton wavelength λ = h/mc sets the natural size scale of a particle. Energy E = mc² gives its rest energy. Try the electron (0.511 MeV), the proton (938 MeV), the top quark (173 GeV), or the Planck mass (1.22 × 10¹⁹ GeV)."
        inputs={[
          { key: 'm_GeV', label: 'Particle mass', default: 0.000511, min: -9, max: 20, log: true, unit: 'GeV/c²' },
        ]}
        compute={(v) => {
          // E = mc² where m in GeV/c² gives E in GeV directly
          const E_GeV = v.m_GeV;
          // Compton wavelength λ = h/(mc) = hc/(mc²)
          // h × c ≈ 1.239 × 10⁻⁶ eV·m = 1.239e-15 GeV·m
          const hc_GeV_m = 1.239e-15;
          const lambda_m = hc_GeV_m / v.m_GeV;
          const lambda_fm = lambda_m * 1e15;
          // Schwarzschild radius if it were a black hole: r_s = 2GM/c²
          // Mass in kg: m_kg = m_GeV × 1.78e-27 (since 1 GeV/c² = 1.78e-27 kg)
          const m_kg = v.m_GeV * 1.78e-27;
          const G = 6.674e-11;
          const c = 2.998e8;
          const r_s = 2 * G * m_kg / (c * c);
          return { E_GeV, lambda_m, lambda_fm, r_s };
        }}
        outputs={[
          { key: 'E_GeV', label: 'Rest energy', unit: 'GeV' },
          { key: 'lambda_m', label: 'Compton wavelength', unit: 'm' },
          { key: 'lambda_fm', label: 'In femtometres (= 10⁻¹⁵ m)', unit: 'fm' },
          { key: 'r_s', label: 'Schwarzschild radius (if a BH)', unit: 'm' },
        ]}
      />

      <WorkedExample title="Why does the Higgs discovery require the LHC?"
                     steps={[
                       { text: 'The Higgs boson has rest mass 125.1 GeV/c². To produce one in a particle collision, you need at least 125.1 GeV of collision energy concentrated in a single interaction.',
                         eq: 'E_min ≈ 125 GeV (just to create one Higgs at rest)' },
                       { text: 'In a proton-proton collider, the two protons each carry ~half the beam energy, but the actual collision is between individual quarks/gluons inside the protons — and each quark/gluon carries only a small fraction (~10%) of the proton\'s momentum.',
                         eq: 'Effective collision energy ≈ 0.1 × E_beam (per proton)' },
                       { text: 'So to reliably have ~125 GeV available in quark-gluon collisions, you need beam energies of order 1 TeV (1000 GeV) per proton — the LHC runs at 6.8 TeV per beam, giving 13.6 TeV center-of-mass energy.',
                         eq: 'E_beam ~ 7 TeV; √s ~ 14 TeV' },
                       { text: 'Even then, Higgs production is rare: ~1 in 10⁹ collisions. The LHC runs ~10⁹ collisions per second to compensate. Over years of running, enough Higgs events accumulate to be distinguished from background.',
                         answer: 'The LHC is large (27 km), powerful (14 TeV), and runs many years at extraordinary luminosity precisely because the Higgs is heavy (125 GeV) and produced rarely. Lower-energy colliders (Tevatron, LEP) could glimpse hints but lacked the energy and statistics to confirm it. ATLAS and CMS both saw the Higgs at >5σ significance in 2012.' },
                     ]} />

      <Quiz questions={[
        { q: 'A proton is made of which combination of quarks?',
          options: ['uud (two up, one down)', 'udd (one up, two down)', 'uuu (three up)', 'ud (one up, one down)'],
          correct: 0,
          explain: 'A proton contains two up quarks (charge +2/3 each) and one down quark (charge −1/3), totaling +1. A neutron contains one up and two down quarks (udd), totaling 0. The "sea" of virtual quarks and gluons inside is much more complex, but the "valence" quarks defining the particle are uud or udd.' },
        { q: 'The Higgs field is special because:',
          options: ['It carries the strong force', 'It has a nonzero value everywhere, even in vacuum', 'It only exists inside particles', 'It travels faster than light'],
          correct: 1,
          explain: 'Most fields are zero in their lowest-energy "vacuum" state and only oscillate where particles exist. The Higgs field has a nonzero value (~246 GeV) everywhere — the vacuum itself is permeated by it. This is why particles can interact with it everywhere and gain mass from it.' },
        { q: 'Why are W and Z bosons short-range while photons are long-range?',
          options: ['Photons travel faster', 'W and Z bosons have huge masses (~80–91 GeV); the photon is massless', 'Photons carry electric charge; W and Z don\'t', 'It\'s a coincidence'],
          correct: 1,
          explain: 'Forces mediated by massive particles are short-range; their range is roughly the Compton wavelength of the carrier. W/Z have masses of ~80–91 GeV, giving range ~10⁻¹⁸ m. The photon is exactly massless (electromagnetism has infinite range). Gluons are also massless but the strong force is confined for a different reason — the gluons interact with themselves.' },
        { q: 'How many fundamental fermions (quarks + leptons) are in the Standard Model?',
          options: ['6', '12', '17', '24'],
          correct: 1,
          explain: '6 quarks + 6 leptons = 12 fermions. Plus 4 gauge bosons (photon, gluon, W, Z) and 1 scalar (Higgs) = 17 fundamental particles total. If you count antiparticles separately, the total is 24 fermions + 13 bosons (gluons come in 8 varieties, W has ±, so distinct gauge bosons = 1 + 8 + 2 + 1 = 12) + 1 Higgs = ~36 particle states.' },
        { q: 'The Standard Model does NOT include:',
          options: ['Gravity', 'Dark matter', 'A particle for dark energy', 'All of the above'],
          correct: 3,
          explain: 'The Standard Model has no quantum theory of gravity, no candidate particle for dark matter, and no explanation for dark energy. These three constitute the bulk of what we don\'t understand about the universe — yet the Standard Model has nothing to say about any of them.' },
      ]} />

      <OpenQuestions items={[
        { q: 'Why exactly three generations of matter?',
          detail: '— The Standard Model accommodates any number of generations as a parameter, but doesn\'t predict three. Z boson decay measurements rule out a fourth light neutrino. But heavy sequential or non-sequential additional generations remain possible. Why nature chose three may require physics beyond the Standard Model — possibly string theory or grand unification.' },
        { q: 'Is the Higgs really fundamental, or is it composite?',
          detail: '— Some theories (e.g. "Technicolor", later "Composite Higgs") propose that the Higgs is actually a bound state of more fundamental particles, similar to how the pion is a quark-antiquark bound state. The Higgs\'s mass and properties are precisely measurable now; if there\'s substructure, it should show up in deviations from Standard Model predictions at higher energy.' },
        { q: 'Are neutrinos their own antiparticles?',
          detail: '— If neutrinos are "Majorana" fermions (their own antiparticles), they would explain why neutrino masses are so small via the "seesaw mechanism", and would allow neutrinoless double beta decay. Several experiments (KamLAND-Zen, GERDA, CUORE) are searching for this signature; none have found it yet, but limits are improving.' },
        { q: 'Where is supersymmetry?',
          detail: '— SUSY (predicting a "superpartner" for every Standard Model particle) was the leading candidate for new physics in the 1980s-2000s, motivated by the hierarchy problem and dark matter. But the LHC has ruled out SUSY at all energies it can reach. Either superpartners are heavier than the LHC can produce, or SUSY is wrong about the natural energy scale, or it\'s simply incorrect.' },
        { q: 'What is dark matter made of?',
          detail: '— We know dark matter exists from its gravitational effects (galaxy rotation curves, cluster dynamics, structure formation, CMB). We know it\'s not Standard Model particles. WIMPs were the leading candidate but direct detection experiments have found nothing. Axions, sterile neutrinos, and primordial black holes remain alive. The next decade of searches should narrow the field.' },
      ]} />
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  ROOT
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view, setView] = useState('hub');
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [view]);

  const views = {
    hr:     <HRDiagram         onBack={() => setView('hub')} />,
    sizes:  <SizeComparison    onBack={() => setView('hub')} />,
    life:   <StellarLifecycle  onBack={() => setView('hub')} />,
    fusion: <NuclearFusion     onBack={() => setView('hub')} />,
    spec:   <SpectralClass     onBack={() => setView('hub')} />,
    ladder: <DistanceLadder    onBack={() => setView('hub')} />,
    bh:     <BlackHole         onBack={() => setView('hub')} />,
    gal:    <GalaxyMorph       onBack={() => setView('hub')} />,
    bb:     <BigBangTimeline   onBack={() => setView('hub')} />,
    exo:    <ExoplanetDetection onBack={() => setView('hub')} />,
    moon:   <MoonTopic         onBack={() => setView('hub')} />,
    obs:    <ObservationalAstronomy onBack={() => setView('hub')} />,
    sr:     <SpecialRelativity onBack={() => setView('hub')} />,
    cmb:    <CMB               onBack={() => setView('hub')} />,
    orb:    <Orbits            onBack={() => setView('hub')} />,
    ss:     <SolarSystem       onBack={() => setView('hub')} />,
    tel:    <Telescopes        onBack={() => setView('hub')} />,
    sm:     <StandardModel     onBack={() => setView('hub')} />,
    paths:  <LearningPaths     onBack={() => setView('hub')} onSelect={setView} />,
  };
  return views[view] || <Hub onSelect={setView} onShowPaths={() => setView('paths')} />;
}
