
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Check, CircleHelp,
  Compass, Globe2, ImagePlus, Menu, Moon, Orbit, Rocket,
  Search, Sparkles, Star, Telescope, X, LoaderCircle,
  type LucideIcon,
} from "lucide-react";

import heroImage from "@/assets/astra-nebula-hero.webp";
import { AstraLogo } from "@/components/astra-logo";
import { AstraChat } from "@/components/astra-chat";
import { Button } from "@/components/ui/button";

type ExploreTopic = {
  name: string;
  category: string;
  description: string;
  fact: string;
  icon: LucideIcon;
};

const topics: ExploreTopic[] = [
  { name: "Mercury", category: "TERRESTRIAL PLANET", description: "The smallest planet and the closest world to the Sun, with a heavily cratered surface and extreme temperature changes.", fact: "A solar day on Mercury lasts 176 Earth days.", icon: Globe2 },
  { name: "Venus", category: "TERRESTRIAL PLANET", description: "A rocky world wrapped in a dense carbon-dioxide atmosphere, with crushing surface pressure and intense heat.", fact: "Venus is the hottest planet because its thick atmosphere traps heat.", icon: Globe2 },
  { name: "Earth", category: "OUR HOME PLANET", description: "Our ocean-covered home: a rocky planet with a protective atmosphere, liquid surface water and life.", fact: "Earth is the only world currently known to support life.", icon: Globe2 },
  { name: "Mars", category: "TERRESTRIAL PLANET", description: "The Red Planet has ancient river channels, giant volcanoes, polar ice and a thin atmosphere.", fact: "Olympus Mons on Mars is the tallest known volcano in the Solar System.", icon: Globe2 },
  { name: "Jupiter", category: "GAS GIANT", description: "The largest planet, with powerful cloud bands, the Great Red Spot and a large family of moons.", fact: "More than 1,300 Earths could fit inside Jupiter by volume.", icon: Globe2 },
  { name: "Saturn", category: "GAS GIANT", description: "A giant planet surrounded by a spectacular ring system made mostly of water ice and rocky material.", fact: "Saturn is less dense than water on average.", icon: Orbit },
  { name: "Uranus", category: "ICE GIANT", description: "A pale blue ice giant that rotates on its side, giving it extreme seasonal changes.", fact: "Uranus takes about 84 Earth years to orbit the Sun.", icon: Orbit },
  { name: "Neptune", category: "ICE GIANT", description: "A distant, dark-blue ice giant with supersonic winds and a dynamic atmosphere.", fact: "Neptune takes about 165 Earth years to complete one orbit.", icon: Orbit },
  { name: "Pluto", category: "DWARF PLANET", description: "A small icy world in the Kuiper Belt with mountains, glaciers and a thin atmosphere.", fact: "Pluto was reclassified as a dwarf planet in 2006.", icon: Moon },
  { name: "The Solar System", category: "PLANETARY SYSTEM", description: "Meet the Sun, eight planets, dwarf planets, moons, asteroids and comets that share our cosmic neighbourhood.", fact: "The Solar System formed about 4.6 billion years ago.", icon: Orbit },
  { name: "The Sun", category: "OUR STAR", description: "Explore the star at the centre of our Solar System, its layers, energy and solar activity.", fact: "The Sun contains about 99.8% of the Solar System's total mass.", icon: Sparkles },
  { name: "The Moon", category: "EARTH'S NATURAL SATELLITE", description: "Explore lunar phases, craters, eclipses, missions and the Moon's relationship with Earth.", fact: "The Moon is moving away from Earth by about 3.8 centimetres each year.", icon: Moon },
  { name: "Orion Nebula", category: "STAR-FORMING REGION", description: "Visit a nearby stellar nursery where clouds of gas and dust are forming new stars.", fact: "The Orion Nebula can be seen with the unaided eye under dark skies.", icon: Sparkles },
  { name: "Stars & Nebulae", category: "STELLAR SCIENCE", description: "Discover how stars are born, evolve and change, and how nebulae shape their life cycles.", fact: "A nebula is a vast cloud of gas and dust in space.", icon: Sparkles },
  { name: "Galaxies", category: "DEEP SPACE", description: "Explore enormous gravitational systems containing stars, gas, dust and dark matter.", fact: "Our Solar System is part of the Milky Way galaxy.", icon: Globe2 },
  { name: "Black Holes", category: "ASTROPHYSICS", description: "Understand extreme gravity, event horizons and how astronomers study these objects.", fact: "A black hole's event horizon marks the boundary beyond which light cannot escape.", icon: CircleHelp },
  { name: "Space Missions", category: "HUMAN EXPLORATION", description: "Follow spacecraft, rovers and observatories expanding our view of the cosmos.", fact: "The Voyager spacecraft carry messages from Earth into interstellar space.", icon: Rocket },
];

const discoveries = [
  { category: "ICY MOONS", title: "An ocean beneath the ice", detail: "Saturn's moon Enceladus sends water-rich plumes into space. These jets give scientists a way to study material from its hidden ocean.", accent: "text-brand-cyan", number: "01" },
  { category: "DISTANT WORLDS", title: "A world with two suns", detail: "Kepler-16b orbits a pair of stars, showing that planets can exist in systems very different from our own.", accent: "text-brand-violet", number: "02" },
  { category: "GALACTIC SCALE", title: "Our place in a spiral", detail: "The Milky Way is a barred spiral galaxy containing our Sun and hundreds of billions of stars.", accent: "text-brand-blue", number: "03" },
];

const missions = [
  { id: "moon", level: "BEGINNER", title: "Meet the Moon", detail: "Explore phases, craters and the near side of our natural satellite.", question: "What causes the Moon's phases?", options: ["Earth's shadow covers it every night", "We see different portions of its sunlit half", "The Moon changes its shape"], answer: 1, explanation: "The Sun always illuminates half of the Moon. As the Moon orbits Earth, we see different portions of that lit half." },
  { id: "mars", level: "EXPLORER", title: "Journey to Mars", detail: "Discover the red planet's atmosphere, landscape and robotic explorers.", question: "Why does Mars look reddish?", options: ["Its surface contains iron-rich dust", "It is covered in red oceans", "It glows like a star"], answer: 0, explanation: "Iron minerals in Martian rocks and dust have oxidised, creating the rusty colour." },
  { id: "black-hole", level: "CHALLENGE", title: "Black Hole Mystery", detail: "Investigate gravity, event horizons and the limits of observation.", question: "What is the event horizon?", options: ["A black hole's bright surface", "The boundary beyond which light cannot escape", "The centre of a galaxy"], answer: 1, explanation: "The event horizon is the boundary around a black hole beyond which escape is impossible." },
];

type Place = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

type Weather = {
  temperature: number;
  cloud: number;
  humidity: number;
  wind: number;
  description: string;
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ASTRA — Your Personal Universe Explorer" },
      { name: "description", content: "Explore the sky, discover the science of space, and follow your curiosity with ASTRA." },
      { name: "author", content: "Ankit Das" },
      { name: "creator", content: "Ankit Das" },
      { property: "og:title", content: "ASTRA — Your Personal Universe Explorer" },
      { property: "og:description", content: "Explore the sky, discover the science of space, and follow your curiosity with ASTRA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<ExploreTopic | null>(null);
  const [topicShuffle, setTopicShuffle] = useState(0);

  const [city, setCity] = useState("Kolkata, India");
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    latitude: number;
    longitude: number;
    timezone?: string;
  } | null>({
    name: "Kolkata, India",
    latitude: 22.5726,
    longitude: 88.3639,
    timezone: "Asia/Kolkata",
  });
  const [placeLoading, setPlaceLoading] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [skyLoading, setSkyLoading] = useState(false);
  const [skyError, setSkyError] = useState("");

  const [activeDiscovery, setActiveDiscovery] = useState<number | null>(null);
  const [activeMission, setActiveMission] = useState<string | null>(null);
  const [missionAnswers, setMissionAnswers] = useState<Record<string, number>>({});

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState("");
  const [imageName, setImageName] = useState("");
  const [imageAnalysis, setImageAnalysis] = useState("");
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState("");
  const [visionReport, setVisionReport] = useState("");

  const [skyTime, setSkyTime] = useState("21:00");
  const [skyDate, setSkyDate] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  });

  const [observationLocation, setObservationLocation] = useState("Kolkata, India");
  const [observationDate, setObservationDate] = useState(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  });
  const [observationTime, setObservationTime] = useState("21:00");
  const [cameraDirection, setCameraDirection] = useState("Not sure");
  const [observationNotes, setObservationNotes] = useState("");

  const fileInput = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const topicBriefRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = city.trim();
    if (!query || (selectedPlace && query === selectedPlace.name)) {
      setPlaces([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setPlaceLoading(true);
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Location search is temporarily unavailable.");
        const data = await response.json();
        setPlaces(data.results ?? []);
      } catch {
        if (!controller.signal.aborted) setPlaces([]);
      } finally {
        if (!controller.signal.aborted) setPlaceLoading(false);
      }
    }, 450);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [city, selectedPlace]);

  useEffect(() => {
    if (!selectedPlace) {
      setWeather(null);
      return;
    }

    const controller = new AbortController();

    const loadWeather = async () => {
      try {
        setSkyLoading(true);
        setSkyError("");

        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${selectedPlace.latitude}` +
          `&longitude=${selectedPlace.longitude}` +
          "&hourly=temperature_2m,relative_humidity_2m,cloud_cover,wind_speed_10m" +
          `&timezone=${encodeURIComponent(selectedPlace.timezone || "auto")}&forecast_days=7`;

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Weather service did not return a forecast.");

        const data = await response.json();
        const hourly = data.hourly;

        if (!hourly?.time?.length) {
          throw new Error("Hourly weather data is unavailable.");
        }

        const target = `${skyDate}T${skyTime}`;
        let index = hourly.time.indexOf(target);

        if (index < 0) {
          index = hourly.time.findIndex((time: string) => time >= target);
        }

        if (index < 0) {
          throw new Error("Weather forecast is not available for this date and time.");
        }

        const cloud = hourly.cloud_cover?.[index];
        const temperature = hourly.temperature_2m?.[index];
        const humidity = hourly.relative_humidity_2m?.[index];
        const wind = hourly.wind_speed_10m?.[index];

        if (cloud == null || temperature == null || humidity == null || wind == null) {
          throw new Error("Weather data is incomplete for the selected time.");
        }

        if (!controller.signal.aborted) {
          setWeather({
            temperature,
            cloud,
            humidity,
            wind,
            description: cloud < 20 ? "Mostly clear" : cloud < 60 ? "Partly cloudy" : "Mostly cloudy",
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setWeather(null);
          setSkyError(error instanceof Error ? error.message : "Could not load sky conditions.");
        }
      } finally {
        if (!controller.signal.aborted) setSkyLoading(false);
      }
    };

    loadWeather();
    return () => controller.abort();
  }, [selectedPlace, skyDate, skyTime]);

  const filteredTopics = useMemo(() => {
    const query = topicSearch.trim().toLowerCase();
    if (!query) return topics;

    return topics
      .filter((topic) =>
        `${topic.name} ${topic.category} ${topic.description} ${
          topic.name === "Earth" ? "home world our planet ground" : ""
        } ${topic.name === "The Moon" ? "moon lunar satellite" : ""} ${
          topic.name === "The Sun" ? "sun sol solar" : ""
        }`.toLowerCase().includes(query),
      )
      .sort((a, b) => {
        const score = (name: string) =>
          name.toLowerCase() === query
            ? 0
            : name.toLowerCase().replace(/^the /, "") === query
              ? 1
              : name.toLowerCase().startsWith(query)
                ? 2
                : 3;
        return score(a.name) - score(b.name);
      });
  }, [topicSearch]);

  const navigation = [
    { label: "Sky now", href: "#sky-now" },
    { label: "Explore", href: "#explore" },
    { label: "ASTRA AI", href: "#astra-ai" },
    { label: "Missions", href: "#missions" },
    { label: "Point & Discover", href: "#point-discover" },
  ];

  const currentMission = missions.find((mission) => mission.id === activeMission);

  function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setVisionError("Please choose a JPG, PNG, WEBP or GIF image.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setVisionError("Please choose an image smaller than 8 MB.");
      setImagePreview(null);
      setImageData(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      if (!result) {
        setVisionError("The selected image could not be read.");
        return;
      }

      setImagePreview(result);
      setImageData(result.split(",")[1] ?? null);
      setImageMimeType(file.type);
      setImageName(file.name);
      setImageAnalysis("Image loaded successfully. Ready for AI-assisted analysis.");
      setVisionError("");
      setVisionReport("");
    };

    reader.onerror = () => setVisionError("Could not read this image. Please try another file.");
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImagePreview(null);
    setImageData(null);
    setImageMimeType("");
    setImageName("");
    setImageAnalysis("");
    setVisionError("");
    setVisionReport("");
    if (fileInput.current) fileInput.current.value = "";
  }

  async function analyzeImage() {
    if (!imageData || !imageMimeType) {
      setVisionError("Please select an image first.");
      return;
    }

    if (!observationLocation.trim()) {
      setVisionError("Please enter the observation location.");
      return;
    }

    setVisionLoading(true);
    setVisionError("");
    setVisionReport("");

    try {
      const response = await fetch("/api/astra/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageData,
          mimeType: imageMimeType,
          imageName,
          location: observationLocation.trim(),
          date: observationDate,
          time: observationTime,
          direction: cameraDirection,
          notes: observationNotes.trim(),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Image analysis failed (${response.status}).`);
      }

      const analysis =
        typeof data.analysis === "string"
          ? data.analysis
          : typeof data.text === "string"
            ? data.text
            : "";

      if (!analysis) {
        throw new Error("The AI service returned an empty analysis.");
      }

      setVisionReport(
        `ASTRA VISION — AI-ASSISTED OBSERVATION REPORT\n\n` +
        `Image: ${imageName}\n` +
        `Location: ${observationLocation}\n` +
        `Date and local time: ${observationDate} at ${observationTime}\n` +
        `Camera direction: ${cameraDirection}\n` +
        `Observer notes: ${observationNotes.trim() || "None provided"}\n\n` +
        `AI IMAGE ANALYSIS:\n${analysis}\n\n` +
        `IDENTIFICATION STATUS: AI ANALYSIS COMPLETE.\n` +
`ASTRONOMICAL VERIFICATION: PENDING.\n` +
        `This is a visual interpretation, not a confirmed astronomical plate-solve.`
      );
      setImageAnalysis("AI image analysis completed.");
    } catch (error) {
      setVisionError(
        error instanceof Error
          ? error.message
          : "Could not analyze the image. Please try again.",
      );
    } finally {
      setVisionLoading(false);
    }
  }

  useEffect(() => {
    if (visionReport) reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [visionReport]);

  useEffect(() => {
    if (selectedTopic) topicBriefRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedTopic]);

  return (
    <div id="top" className="min-h-screen overflow-hidden bg-background text-foreground">
      
<style>{`
  /* ASTRA — Mobile-only layout optimization */
  @media (max-width: 767px) {

    /* Header */
    #top > header > div:first-child {
      height: 58px;
      padding-left: 16px;
      padding-right: 12px;
      gap: 8px;
    }

    #mobile-navigation a {
      padding-top: 10px;
      padding-bottom: 10px;
    }

    /* Hero */
    #top > main > section:first-child {
      min-height: auto;
    }

    #top > main > section:first-child > div.relative {
      min-height: auto;
      padding: 64px 18px 58px;
      gap: 28px;
    }

    #top > main > section:first-child h1 {
      font-size: clamp(48px, 13vw, 66px);
      line-height: 0.98;
    }

    #top > main > section:first-child h1 span {
      margin-top: 8px;
    }

    #top > main > section:first-child p {
      line-height: 1.65;
    }

    #top > main > section:first-child .max-w-2xl > p:first-child {
      margin-bottom: 18px;
      font-size: 10px;
      letter-spacing: 0.16em;
    }

    #top > main > section:first-child .max-w-2xl > p:nth-of-type(2) {
      margin-top: 18px;
      font-size: 14px;
      line-height: 1.7;
    }

    #top > main > section:first-child .max-w-2xl > div {
      margin-top: 22px;
      gap: 9px;
    }

    #top > main > section:first-child .max-w-2xl > div:last-child {
      margin-top: 24px;
      column-gap: 14px;
      row-gap: 10px;
      font-size: 10px;
    }

    /* All main sections */
    #top > main > section:not(:first-child) {
      padding: 46px 16px;
      scroll-margin-top: 68px;
    }

    #top > main > section > div.mx-auto {
      gap: 28px;
    }

    /* Section headings */
    #top > main h2 {
      font-size: clamp(29px, 8vw, 38px);
      line-height: 1.12;
    }

    #top > main section > div > div > p,
    #top > main section > div > p {
      line-height: 1.65;
    }

    /* Sky Now */
    #sky-now .mt-8 {
      margin-top: 20px;
    }

    #sky-now .rounded-xl {
      padding: 13px;
    }

    #sky-now .relative.mt-8 {
      margin-top: 18px;
    }

    #sky-now article {
      padding: 13px;
    }

    #sky-now article .mt-5 {
      margin-top: 12px;
    }

    /* Space Explorer */
    #explore .mt-8 {
      margin-top: 18px;
    }

    #explore article {
      padding: 17px;
      border-radius: 15px;
    }

    #explore article > span {
      width: 40px;
      height: 40px;
    }

    #explore article > p:first-of-type {
      margin-top: 16px;
    }

    #explore article h3 {
      font-size: 21px;
    }

    #explore article .mt-3 {
      margin-top: 8px;
    }

    #explore article .mt-5 {
      margin-top: 13px;
    }

    #explore article .mt-4 {
      margin-top: 11px;
    }

    #explore .mt-8.grid {
      gap: 11px;
    }

    #explore [aria-live="polite"] {
      padding: 17px;
    }

    /* ASTRA AI */
    #astra-ai .rounded-xl {
      padding: 13px;
    }

    #astra-ai > div {
      gap: 22px;
    }

    /* Discoveries */
    #discoveries article {
      padding-top: 19px;
      padding-bottom: 19px;
    }

    #discoveries article h3 {
      font-size: 21px;
    }

    #discoveries article button > div > p {
      margin-top: 8px;
      line-height: 1.6;
    }

    #discoveries article .mt-5 {
      padding: 14px;
    }

    /* Missions */
    #missions .mb-10 {
      margin-bottom: 22px;
    }

    #missions article {
      padding: 18px;
    }

    #missions article h3 {
      margin-top: 18px;
      font-size: 21px;
    }

    #missions article .mt-6 {
      margin-top: 15px;
    }

    #missions [aria-live="polite"] {
      padding: 17px;
    }

    /* Mission answers */
    #missions [aria-live="polite"] button {
      padding: 12px;
    }

    /* ASTRA Vision */
    #point-discover .mb-10 {
      margin-bottom: 22px;
    }

    #point-discover .rounded-2xl {
      border-radius: 15px;
    }

    #point-discover .rounded-2xl > div {
      min-width: 0;
    }

    #point-discover .min-h-64 {
      min-height: 180px;
    }

    #point-discover .max-h-80 {
      max-height: 220px;
    }

    #point-discover .grid {
      gap: 12px;
    }

    #point-discover textarea {
      min-height: 78px;
    }

    /* About */
    #about > div {
      padding: 22px;
      gap: 22px;
      border-radius: 20px;
    }

    #about h2 {
      font-size: 32px;
    }

    /* Footer */
    #top > footer {
      padding: 25px 16px;
    }

    #top > footer > div {
      gap: 17px;
    }

    /* Prevent horizontal overflow */
    #top,
    #top > main,
    #top > main > section {
      max-width: 100%;
      min-width: 0;
    }

    #top img {
      max-width: 100%;
    }

    #top button,
    #top input,
    #top select,
    #top textarea {
      max-width: 100%;
    }
  }
`}</style>

      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <a href="#top" aria-label="ASTRA home" className="shrink-0">
            <AstraLogo size="small" />
          </a>
          <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden rounded-full px-5 sm:inline-flex">
              <a href="#sky-now">Start exploring <ArrowRight aria-hidden="true" /></a>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={menuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </Button>
          </div>
        </div>
        {menuOpen && (
          <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-border bg-background px-5 py-3 md:hidden">
            {navigation.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block border-b border-border/70 py-3 text-sm text-muted-foreground last:border-0 hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main>
        <section className="relative isolate min-h-[650px] overflow-hidden border-b border-border/70">
          <img src={heroImage} alt="A luminous blue and violet nebula in a distant star field" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover object-[62%_center]" />
          <div aria-hidden="true" className="hero-image-wash absolute inset-0" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/35 to-transparent" />
          <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-[1.1fr_.9fr]">
            <div className="max-w-2xl">
              <p className="mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                <span className="size-2 rounded-full bg-brand-cyan celestial-pulse" />Your Personal Universe Explorer
              </p>
              <h1 className="font-display text-6xl font-medium leading-[0.98] tracking-tight sm:text-7xl lg:text-8xl">
                Look up.<span className="mt-3 block bg-gradient-to-r from-brand-cyan via-sky-300 to-brand-violet bg-clip-text text-transparent">Go beyond.</span>
              </h1>
              <p className="mt-7 max-w-lg text-base leading-8 text-foreground/80 sm:text-lg">
                The universe is closer than you think. Discover what is above you, explore what lies beyond, and follow every question further.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
                  <a href="#sky-now">Explore my sky <ArrowRight aria-hidden="true" /></a>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-full border-foreground/25 bg-background/25 px-6 text-base text-foreground hover:bg-background/60 hover:text-foreground">
                  <a href="#explore"><Telescope aria-hidden="true" /> Discover space</a>
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Star className="size-3 text-brand-cyan" /> Real science</span>
                <span className="inline-flex items-center gap-2"><Orbit className="size-3 text-brand-violet" /> Guided discovery</span>
                <span className="inline-flex items-center gap-2"><Sparkles className="size-3 text-brand-blue" /> Big questions</span>
              </div>
            </div>
            <div className="hidden items-end justify-end md:flex">
              <div className="max-w-xs rounded-2xl border border-white/15 bg-background/45 p-5 shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-cyan">A universe of stories</p>
                <p className="mt-3 font-display text-2xl">Every star has a story.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Start with one question. See where the universe takes you.</p>
                <a href="#discoveries" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-cyan">Explore discoveries <ArrowUpRight className="size-4" /></a>
              </div>
            </div>
          </div>
          <a href="#sky-now" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground md:flex">
            Scroll to explore <ArrowDownRight className="size-4" />
          </a>
        </section>

        <section id="sky-now" className="scroll-mt-24 border-b border-border/70 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">01 / Sky now</p>
              <h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl">Your sky. Your moment. Your universe.</h2>
              <p className="mt-5 max-w-xl leading-7 text-muted-foreground">Choose an exact place and observing time. ASTRA uses the selected coordinates to retrieve a local weather snapshot; astronomical object visibility is still being developed.</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="relative block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your location
                  <input value={city} onChange={(event) => { setCity(event.target.value); setSelectedPlace(null); }} placeholder="Type a city or area…" autoComplete="off" className="mt-2 h-12 w-full rounded-lg border border-input bg-brand-surface px-4 text-sm font-normal normal-case tracking-normal text-foreground outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20" />
                  {placeLoading && <p className="mt-1 text-[11px] normal-case text-muted-foreground">Searching locations…</p>}
                  {places.length > 0 && (
                    <div className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border bg-brand-surface p-1 shadow-2xl">
                      {places.map((place) => (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => {
                            const name = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
                            setCity(name);
                            setSelectedPlace({
                              name,
                              latitude: place.latitude,
                              longitude: place.longitude,
                              ...(place.timezone ? { timezone: place.timezone } : {}),
                            });
                            setPlaces([]);
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm normal-case text-foreground hover:bg-brand-cyan/10"
                        >
                          {place.name}
                          <span className="block text-xs text-muted-foreground">{[place.admin1, place.country].filter(Boolean).join(", ")} · {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!selectedPlace && city.trim().length > 1 && !placeLoading && places.length === 0 && (
                    <p className="mt-1 text-[11px] normal-case text-amber-200">Choose a matching result to set exact coordinates.</p>
                  )}
                </div>

                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Observation date
                  <input type="date" value={skyDate} onChange={(event) => setSkyDate(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-input bg-brand-surface px-4 text-sm font-normal normal-case tracking-normal text-foreground outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20" />
                </label>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Observation time
                  <input type="time" value={skyTime} onChange={(event) => setSkyTime(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-input bg-brand-surface px-4 text-sm font-normal normal-case tracking-normal text-foreground outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20" />
                </label>
              </div>

              <div className="mt-5 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4">
                <div className="flex items-start gap-3">
                  <Compass className="mt-0.5 size-5 shrink-0 text-brand-cyan" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Your observation plan</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {selectedPlace ? selectedPlace.name : "Select a location from the suggestions"}
                      <br />{skyDate} · {skyTime} local time
                      {selectedPlace && <><br />Coordinates: {selectedPlace.latitude.toFixed(4)}, {selectedPlace.longitude.toFixed(4)}</>}
                    </p>
                  </div>
                </div>
                <div className="mt-4 border-t border-brand-cyan/15 pt-3">
                  {skyLoading ? <p className="text-xs text-muted-foreground">Loading local weather…</p> :
                    weather ? (
                      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                        <div><p className="text-muted-foreground">Conditions</p><p className="mt-1 font-semibold">{weather.description}</p></div>
                        <div><p className="text-muted-foreground">Temperature</p><p className="mt-1 font-semibold">{weather.temperature}°C</p></div>
                        <div><p className="text-muted-foreground">Cloud cover</p><p className="mt-1 font-semibold">{weather.cloud}%</p></div>
                        <div><p className="text-muted-foreground">Humidity / wind</p><p className="mt-1 font-semibold">{weather.humidity}% · {weather.wind} km/h</p></div>
                      </div>
                    ) : <p className="text-xs leading-5 text-muted-foreground">{skyError || "Select a confirmed location to load weather."}</p>}
                  <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Weather data: Open-Meteo. This is not an astronomy visibility forecast. Cloud cover alone cannot confirm whether a celestial object is visible.</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-border bg-brand-surface p-6 sm:p-8">
              <div className="absolute -right-20 -top-24 size-64 rounded-full bg-brand-violet/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">A field guide to the sky</p><p className="mt-1 text-sm text-muted-foreground">Objects worth getting to know</p></div>
                <Moon className="size-6 text-brand-violet" />
              </div>
              <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { name: "The Moon", kind: "NATURAL SATELLITE", detail: "Phases, craters and eclipses", icon: Moon },
                  { name: "Jupiter", kind: "GAS GIANT", detail: "Cloud bands and giant storms", icon: Globe2 },
                  { name: "Orion Nebula", kind: "STAR-FORMING REGION", detail: "A stellar nursery in Orion", icon: Sparkles },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.name} className="rounded-xl border border-border/80 bg-background/60 p-4">
                      <span className="flex size-10 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan"><Icon className="size-5" /></span>
                      <p className="mt-5 text-[10px] font-semibold tracking-[0.14em] text-brand-violet">{item.kind}</p>
                      <h3 className="mt-2 font-display text-lg">{item.name}</h3>
                      <p className="mt-2 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                    </article>
                  );
                })}
              </div>
              <p className="relative mt-6 border-t border-border/70 pt-4 text-xs leading-5 text-muted-foreground">Sky positions, rise and set times, horizon obstructions, light pollution and cloud cover must be checked before relying on a real-world observation forecast.</p>
            </div>
          </div>
        </section>

        <section id="explore" className="scroll-mt-24 border-b border-border/70 bg-brand-surface/35 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-violet">02 / Space explorer</p><h2 className="max-w-2xl font-display text-4xl font-medium leading-tight sm:text-5xl">Choose a question. Open a universe.</h2></div>
              <div className="max-w-md">
                <p className="leading-7 text-muted-foreground">Explore the science behind the objects, forces and discoveries that make the cosmos extraordinary.</p>
                <Button type="button" variant="outline" className="mt-4 rounded-full" onClick={() => {
                  const next = topics[(topicShuffle + Math.floor(Math.random() * (topics.length - 1)) + 1) % topics.length];
                  setTopicShuffle((value) => value + 1);
                  setTopicSearch("");
                  if (next) {
  setSelectedTopic(next);
}
                }}>Discover something new <Sparkles className="size-4" /></Button>
              </div>
            </div>

            <div className="relative mt-9 max-w-md">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={topicSearch} onChange={(event) => setTopicSearch(event.target.value)} placeholder="Search planets, galaxies, black holes..." aria-label="Search space topics" className="h-12 w-full rounded-full border border-input bg-background pl-11 pr-4 text-sm outline-none transition focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20" />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTopics.map((topic) => {
                const Icon = topic.icon;
                return (
                  <article key={topic.name} className={`group rounded-2xl border bg-background p-6 transition duration-300 hover:-translate-y-1 hover:border-brand-cyan/50 hover:shadow-[0_16px_50px_-28px_rgba(56,189,248,.35)] ${selectedTopic?.name === topic.name ? "border-brand-cyan/60" : "border-border"}`}>
                    <span className="flex size-12 items-center justify-center rounded-xl bg-brand-violet/10 text-brand-cyan transition group-hover:bg-brand-cyan/10"><Icon className="size-6" /></span>
                    <p className="mt-7 text-[10px] font-semibold tracking-[0.18em] text-brand-violet">{topic.category}</p>
                    <h3 className="mt-2 font-display text-2xl">{topic.name}</h3>
                    <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{topic.description}</p>
                    <div className="mt-5 border-t border-border/70 pt-4">
                      <p className="text-xs leading-5 text-foreground/75"><span className="font-semibold text-brand-cyan">Did you know?</span> {topic.fact}</p>
                      <button type="button" onClick={() => setSelectedTopic(topic)} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-brand-cyan hover:text-foreground">Explore topic <ArrowUpRight className="size-3.5" /></button>
                    </div>
                  </article>
                );
              })}
              {filteredTopics.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No topics match that search. Try another space term.</p>}
            </div>

            {selectedTopic && (
              <div ref={topicBriefRef} className="mt-6 scroll-mt-24 rounded-2xl border border-brand-cyan/25 bg-brand-cyan/5 p-6" aria-live="polite">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-cyan">{selectedTopic.category} / DISCOVERY</p>
                    <h3 className="mt-2 font-display text-3xl">{selectedTopic.name}</h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">{selectedTopic.description}</p>
                    <p className="mt-4 text-sm leading-6"><span className="font-semibold text-brand-cyan">Key fact:</span> {selectedTopic.fact}</p>
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">This is an introductory science briefing. Explore related missions and ask ASTRA AI follow-up questions to continue learning.</p>
                  </div>
                  <button type="button" onClick={() => setSelectedTopic(null)} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">Close</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section id="astra-ai" className="scroll-mt-24 border-b border-border/70 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-violet"><Sparkles className="size-4" /> 03 / ASTRA AI</p>
              <h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl">Big questions deserve clear answers.</h2>
              <p className="mt-5 max-w-lg leading-7 text-muted-foreground">A space-learning companion designed to make complex ideas easier to understand. Start a conversation, return to an earlier one, or open a new chat whenever curiosity takes you somewhere new.</p>
              <div className="mt-7 rounded-xl border border-brand-violet/20 bg-brand-violet/5 p-4">
                <p className="text-sm font-semibold">Local chat history</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Your conversations are saved in this browser. No account or sign-in is required. Live AI availability depends on the connected server.</p>
              </div>
            </div>
            <AstraChat />
          </div>
        </section>

        <section id="discoveries" className="scroll-mt-24 border-b border-border/70 bg-brand-surface/35 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-20">
            <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">04 / Discoveries</p><h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl">The universe keeps unfolding.</h2><p className="mt-5 max-w-md leading-7 text-muted-foreground">A few real ideas worth following. Every discovery opens the door to another question.</p></div>
            <div className="divide-y divide-border/70 border-y border-border/70">
              {discoveries.map((item, index) => (
                <article key={item.number} className="py-7">
                  <button type="button" aria-expanded={activeDiscovery === index} onClick={() => setActiveDiscovery(activeDiscovery === index ? null : index)} className="grid w-full gap-3 text-left sm:grid-cols-[4rem_1fr_auto] sm:items-start sm:gap-6">
                    <p className={`font-display text-sm ${item.accent}`}>{item.number} / {item.category}</p>
                    <div><h3 className="font-display text-2xl sm:text-3xl">{item.title}</h3><p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">{item.detail}</p></div>
                    <span className="flex items-center gap-2 text-xs text-brand-cyan">{activeDiscovery === index ? "Close" : "Explore"}<ArrowUpRight className={`size-5 transition-transform ${activeDiscovery === index ? "rotate-45" : ""}`} /></span>
                  </button>
                  {activeDiscovery === index && (
                    <div className="ml-0 mt-5 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-5 sm:ml-16">
                      <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan">Discovery briefing</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.detail} This discovery connects planetary science, observation and the methods scientists use to study distant environments. Explore the related topic in Space Explorer to continue learning.</p>
                      <button type="button" onClick={() => {
                        setTopicSearch(index === 0 ? "Moon" : index === 1 ? "Solar System" : "Galaxies");
                        document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
                      }} className="mt-4 text-xs font-semibold text-brand-cyan hover:text-foreground">Open related Space Explorer topics →</button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="missions" className="scroll-mt-24 border-b border-border/70 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div><p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-violet">05 / Space missions</p><h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl">Curiosity, put to the test.</h2></div>
              <p className="max-w-md leading-7 text-muted-foreground">Take a short mission, test what you know, and learn something new along the way.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {missions.map((mission) => (
                <article key={mission.id} className="rounded-2xl border border-border bg-brand-surface p-6">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-semibold tracking-[0.18em] text-brand-cyan">{mission.level}</span><Rocket className="size-5 text-brand-violet" /></div>
                  <h3 className="mt-8 font-display text-2xl">{mission.title}</h3>
                  <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{mission.detail}</p>
                  <Button className="mt-6 rounded-full" variant="outline" onClick={() => {
                    setActiveMission(mission.id);
                    setMissionAnswers((old) => {
                      const next = { ...old };
                      delete next[mission.id];
                      return next;
                    });
                  }}>Start mission <ArrowRight className="size-4" /></Button>
                </article>
              ))}
            </div>
            {currentMission && (
              <div className="mt-7 rounded-2xl border border-brand-cyan/30 bg-brand-cyan/5 p-6 sm:p-8" aria-live="polite">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">Mission in progress</p>
                  <button type="button" onClick={() => setActiveMission(null)} className="text-sm text-muted-foreground hover:text-foreground">Close mission <X className="ml-1 inline size-4" /></button>
                </div>
                <h3 className="mt-3 font-display text-2xl">{currentMission.title}</h3>
                <p className="mt-5 font-medium">{currentMission.question}</p>
                <div className="mt-4 grid gap-2">
                  {currentMission.options.map((option, index) => {
                    const selected = missionAnswers[currentMission.id];
                    const answered = selected !== undefined;
                    const correct = index === currentMission.answer;
                    return (
                      <button key={option} type="button" disabled={answered} onClick={() => setMissionAnswers((old) => ({ ...old, [currentMission.id]: index }))} className={`flex items-center justify-between gap-3 rounded-xl border p-4 text-left text-sm transition ${answered && correct ? "border-emerald-400/50 bg-emerald-400/10" : answered && selected === index ? "border-destructive/50 bg-destructive/10" : "border-border bg-background/70 hover:border-brand-cyan/50"}`}>
                        <span>{option}</span>{answered && correct && <Check className="size-4 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
                {missionAnswers[currentMission.id] !== undefined && (
                  <div className="mt-5 rounded-xl bg-background/70 p-4">
                    <p className="font-semibold">{missionAnswers[currentMission.id] === currentMission.answer ? "Correct. Mission accomplished!" : "Good attempt. Here is what to remember."}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{currentMission.explanation}</p>
                    <button type="button" onClick={() => setMissionAnswers((old) => {
                      const next = { ...old };
                      delete next[currentMission.id];
                      return next;
                    })} className="mt-3 text-sm font-semibold text-brand-cyan">Try again</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section id="point-discover" className="scroll-mt-24 border-b border-border/70 bg-brand-surface/35 px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-3xl">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">06 / ASTRA VISION</p>
              <h2 className="font-display text-4xl font-medium leading-tight sm:text-5xl">Look closer. Understand your sky.</h2>
              <p className="mt-5 leading-7 text-muted-foreground">Upload a sky photograph and provide its observation details. ASTRA can send the image and context to its connected AI vision service for an assisted interpretation.</p>
            </div>

            <div className="grid items-start gap-8 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-border bg-background p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">01 / Your sky image</p>
                  {imagePreview && <button type="button" onClick={removeImage} className="text-xs text-muted-foreground hover:text-foreground">Remove image</button>}
                </div>
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleImage} />
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Selected sky photograph preview" className="mt-5 max-h-80 w-full rounded-xl object-contain" />
                    <p className="mt-3 truncate text-xs text-muted-foreground">{imageName}</p>
                  </>
                ) : (
                  <button type="button" onClick={() => fileInput.current?.click()} className="mt-5 flex min-h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-brand-surface/60 px-6 text-center transition hover:border-brand-cyan/50">
                    <span className="flex size-14 items-center justify-center rounded-full bg-brand-cyan/10 text-brand-cyan"><ImagePlus className="size-6" /></span>
                    <span className="mt-4 font-display text-lg">Add a photograph of the sky</span>
                    <span className="mt-2 text-sm text-muted-foreground">Choose an image up to 8 MB. JPG, PNG, WEBP or GIF.</span>
                  </button>
                )}
                {imageAnalysis && <div className="mt-4 rounded-xl border border-brand-cyan/20 bg-brand-cyan/5 p-4"><p className="text-xs font-semibold text-brand-cyan">Image status</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{imageAnalysis}</p></div>}
                {visionError && <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{visionError}</div>}
                <p className="mt-4 text-xs leading-5 text-muted-foreground">Your image is sent to ASTRA's server for analysis when you press Analyse image. The server must have its AI vision endpoint configured.</p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-5 sm:p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-violet">02 / Observation details</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-medium text-muted-foreground">Location
                    <input value={observationLocation} onChange={(e) => setObservationLocation(e.target.value)} placeholder="City or observing site" className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-brand-cyan" />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">Date
                    <input type="date" value={observationDate} onChange={(e) => setObservationDate(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-brand-cyan" />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">Time
                    <input type="time" value={observationTime} onChange={(e) => setObservationTime(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-brand-cyan" />
                  </label>
                  <label className="text-xs font-medium text-muted-foreground">Camera direction
                    <select value={cameraDirection} onChange={(e) => setCameraDirection(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-brand-cyan">
                      <option>Not sure</option><option>North</option><option>North-East</option><option>East</option><option>South-East</option><option>South</option><option>South-West</option><option>West</option><option>North-West</option><option>Overhead</option>
                    </select>
                  </label>
                </div>
                <label className="mt-4 block text-xs font-medium text-muted-foreground">Anything you noticed? (optional)
                  <textarea value={observationNotes} onChange={(e) => setObservationNotes(e.target.value)} rows={3} placeholder="For example: a bright point near the Moon, a curved line of stars..." className="mt-2 w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-brand-cyan" />
                </label>
                <Button className="mt-5 w-full rounded-full" disabled={!imagePreview || visionLoading} onClick={analyzeImage}>
                  {visionLoading ? <><LoaderCircle className="size-4 animate-spin" /> Analysing image…</> : <><Sparkles className="size-4" /> Analyse image with ASTRA AI</>}
                </Button>
                {!imagePreview && <p className="mt-3 text-center text-xs text-muted-foreground">Add a sky image to begin analysis.</p>}
                {visionLoading && <p className="mt-3 text-center text-xs text-muted-foreground">The image is being sent for AI-assisted interpretation. This may take a little time.</p>}
              </div>
            </div>

            {visionReport && (
              <div ref={reportRef} className="mt-8 scroll-mt-24 rounded-2xl border border-brand-cyan/25 bg-background p-5 sm:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">03 / ASTRA VISION REPORT</p>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/5 px-3 py-1 text-[10px] font-semibold tracking-wider text-emerald-300">AI ANALYSIS COMPLETE</span>
                  <p className="mt-2 text-xs text-amber-300">Astronomical verification: Pending</p>
                </div>
                <pre className="mt-5 whitespace-pre-wrap font-sans text-sm leading-7 text-muted-foreground">{visionReport}</pre>
                <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">AI visual interpretation is not the same as astronomical verification. Reliable star-field identification may require plate-solving with accurate observation time, location and camera information.</p>
                <Button variant="outline" className="mt-4 rounded-full" onClick={() => {
                  void navigator.clipboard?.writeText(visionReport);
                }}>Copy observation report</Button>
              </div>
            )}
          </div>
        </section>

        <section id="about" className="px-5 py-20 sm:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 rounded-3xl border border-brand-violet/20 bg-gradient-to-br from-brand-violet/10 via-brand-surface to-brand-cyan/5 p-7 sm:p-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-brand-violet">The idea behind ASTRA</p>
              <h2 className="max-w-2xl font-display text-4xl font-medium leading-tight sm:text-5xl">Made for the endlessly curious.</h2>
              <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">ASTRA brings sky discovery and space learning into one welcoming place. The goal is simple: make the universe feel a little closer, one question at a time.</p>
            </div>
            <div className="md:min-w-52 md:border-l md:border-border/70 md:pl-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Created by</p>
              <p className="mt-2 font-display text-2xl font-semibold">Ankit Das</p>
              <p className="mt-1 text-sm text-muted-foreground">Founder & Creator of ASTRA</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div><AstraLogo size="small" /><p className="mt-2 text-sm text-muted-foreground">Your Personal Universe Explorer.</p></div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-foreground">About</a>
            <a href="#sky-now" className="hover:text-foreground">Sky now</a>
            <a href="#explore" className="hover:text-foreground">Explore</a>
            <a href="#top" className="hover:text-foreground">Back to top</a>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-7xl border-t border-border/60 pt-5 text-xs text-muted-foreground">
          © {new Date().getFullYear()} ASTRA. Created by Ankit Das. Weather lookup and AI-assisted image analysis features.
        </div>
      </footer>
    </div>
  );
}
