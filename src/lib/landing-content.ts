export type Locale = "es" | "en";

export const localePath: Record<Locale, string> = { es: "/", en: "/en" };

type Feature = { icon: string; title: string; body: string };
type Step = { title: string; body: string };

type LandingContent = {
  metaTitle: string;
  metaDescription: string;
  nav: { features: string; how: string; login: string; signup: string };
  hero: {
    eyebrow: string;
    title: string;
    highlight: string;
    body: string;
    ctaPrimary: string;
    ctaSecondary: string;
    note: string;
  };
  logos: { label: string; items: string[] };
  features: { title: string; subtitle: string; items: Feature[] };
  guest: { title: string; body: string; items: string[] };
  how: { title: string; subtitle: string; steps: Step[] };
  cta: { title: string; body: string; button: string; note: string };
  footer: { tagline: string; rights: string };
};

export const content: Record<Locale, LandingContent> = {
  es: {
    metaTitle: "Sports Academy — Gestión de academias deportivas",
    metaDescription:
      "La plataforma para administrar tu academia deportiva: equipos, atletas, entrenamientos, jornadas, buses y donaciones. Convocatorias por link, sin apps para padres.",
    nav: { features: "Funciones", how: "Cómo funciona", login: "Ingresar", signup: "Crear cuenta" },
    hero: {
      eyebrow: "Para academias y clubes deportivos",
      title: "Administrá tu academia sin",
      highlight: "hojas de cálculo ni grupos de WhatsApp",
      body:
        "Equipos, atletas, entrenamientos y jornadas en un solo lugar. Los padres confirman asistencia y coordinan buses o donaciones con un simple link — no necesitan cuenta ni instalar nada.",
      ctaPrimary: "Creá tu academia gratis",
      ctaSecondary: "Ya tengo cuenta",
      note: "Sin tarjeta de crédito · Tu academia lista en minutos",
    },
    logos: { label: "Pensado para", items: ["Baloncesto", "Fútbol", "Voleibol", "Academias multi-deporte"] },
    features: {
      title: "Todo lo que tu cuerpo técnico necesita",
      subtitle: "Una sola herramienta para reemplazar las hojas de cálculo, los chats y los papeles sueltos.",
      items: [
        { icon: "🏀", title: "Equipos y atletas", body: "Categorías, temporadas, entrenadores y ficha completa de cada atleta: medidas, posiciones y contacto del encargado." },
        { icon: "📅", title: "Planificador de entrenamientos", body: "Calendario semanal con plan, observaciones del entrenador y repetición automática." },
        { icon: "🏆", title: "Jornadas y partidos", body: "Programá partidos por categoría, marcá resultados y llevá el historial de la temporada." },
        { icon: "🚌", title: "Buses con cupo", body: "Organizá el transporte por jornada y mirá en vivo quién va en bus según las confirmaciones." },
        { icon: "🥤", title: "Listas de donación", body: "Para partidos de local: pedí snacks o ventas y los padres se anotan con lo que llevan." },
        { icon: "🔐", title: "Acceso por roles", body: "Cada academia es un espacio propio y aislado; invitá a tu cuerpo técnico con su correo." },
      ],
    },
    guest: {
      title: "Los padres confirman con un link. Nada más.",
      body: "Cada jornada y cada lista de donación genera un link único. Los padres lo abren, confirman o rechazan la convocatoria, eligen bus o transporte propio, y se anotan en la lista de donaciones — sin crear cuenta, sin descargar nada.",
      items: ["Confirmar o rechazar convocatoria", "Elegir bus o transporte propio", "Anotarse en la lista de donaciones", "Ver hora, cancha y rival del partido"],
    },
    how: {
      title: "Empezá en tres pasos",
      subtitle: "",
      steps: [
        { title: "Creá tu academia", body: "Registrate con tu correo y contraseña. Tu academia queda lista al instante, aislada del resto." },
        { title: "Cargá equipos y atletas", body: "Sumá tus categorías, tus atletas y a tu cuerpo técnico como personal con acceso." },
        { title: "Compartí el link con los padres", body: "Generá jornadas o listas de donación y compartí el link — el resto lo hacen ellos." },
      ],
    },
    cta: {
      title: "Dejá de perseguir confirmaciones por WhatsApp",
      body: "Creá tu academia hoy y probá la plataforma con tu próxima jornada.",
      button: "Crear mi academia",
      note: "Gratis para empezar",
    },
    footer: { tagline: "Gestión de academias deportivas", rights: "Todos los derechos reservados." },
  },
  en: {
    metaTitle: "Sports Academy — Sports academy management platform",
    metaDescription:
      "The platform for running your sports academy: teams, athletes, trainings, matchdays, buses and donations. Guest link check-ins — no app required for parents.",
    nav: { features: "Features", how: "How it works", login: "Log in", signup: "Sign up" },
    hero: {
      eyebrow: "For sports academies and clubs",
      title: "Run your academy without",
      highlight: "spreadsheets or WhatsApp groups",
      body:
        "Teams, athletes, trainings and matchdays in one place. Parents confirm attendance and sort out buses or donations with a simple link — no account, no app to install.",
      ctaPrimary: "Create your academy free",
      ctaSecondary: "I already have an account",
      note: "No credit card · Your academy ready in minutes",
    },
    logos: { label: "Built for", items: ["Basketball", "Soccer", "Volleyball", "Multi-sport academies"] },
    features: {
      title: "Everything your coaching staff needs",
      subtitle: "One tool to replace the spreadsheets, group chats and loose paper sheets.",
      items: [
        { icon: "🏀", title: "Teams & athletes", body: "Categories, seasons, coaches and a full athlete profile: measurements, positions and guardian contact." },
        { icon: "📅", title: "Training planner", body: "Weekly calendar with the plan, coach observations, and automatic weekly repeat." },
        { icon: "🏆", title: "Matchdays & matches", body: "Schedule matches per category, log results, and keep the season's history." },
        { icon: "🚌", title: "Buses with capacity", body: "Plan transport per matchday and see live who's on the bus based on confirmations." },
        { icon: "🥤", title: "Donation lists", body: "For home matches: ask for snacks or sale items and parents sign up with what they'll bring." },
        { icon: "🔐", title: "Role-based access", body: "Each academy is its own isolated space; invite your coaching staff by email." },
      ],
    },
    guest: {
      title: "Parents confirm with a link. That's it.",
      body: "Every matchday and donation list gets a unique link. Parents open it, confirm or decline the call-up, choose bus or their own transport, and sign up for donations — no account, no download.",
      items: ["Confirm or decline a call-up", "Choose bus or own transport", "Sign up on the donation list", "See match time, court and opponent"],
    },
    how: {
      title: "Get started in three steps",
      subtitle: "",
      steps: [
        { title: "Create your academy", body: "Register with your email and password. Your academy is ready instantly, isolated from everyone else's." },
        { title: "Add teams and athletes", body: "Add your categories, your athletes, and your coaching staff as staff with access." },
        { title: "Share the link with parents", body: "Generate matchdays or donation lists and share the link — they take it from there." },
      ],
    },
    cta: {
      title: "Stop chasing confirmations over WhatsApp",
      body: "Create your academy today and try the platform with your next matchday.",
      button: "Create my academy",
      note: "Free to start",
    },
    footer: { tagline: "Sports academy management", rights: "All rights reserved." },
  },
};
