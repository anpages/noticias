import { NextResponse } from "next/server";

interface Feed {
  title: string;
  xmlUrl: string;
  description: string | null;
  htmlUrl: string | null;
}

const FEEDS: Record<string, Feed[]> = {
  "Tech": [
    { title: "Xataka", xmlUrl: "https://www.xataka.com/feedburner.xml", description: "Tecnología y gadgets", htmlUrl: "https://www.xataka.com" },
    { title: "Genbeta", xmlUrl: "https://www.genbeta.com/feedburner.xml", description: "Software y aplicaciones", htmlUrl: "https://www.genbeta.com" },
    { title: "Hipertextual", xmlUrl: "https://hipertextual.com/feed", description: "Tecnología, ciencia y cultura digital", htmlUrl: "https://hipertextual.com" },
    { title: "Applesfera", xmlUrl: "https://www.applesfera.com/feedburner.xml", description: "Apple en español", htmlUrl: "https://www.applesfera.com" },
    { title: "Xataka Android", xmlUrl: "https://www.xatakandroid.com/feedburner.xml", description: "Android en español", htmlUrl: "https://www.xatakandroid.com" },
    { title: "Xataka Móvil", xmlUrl: "https://www.xatakamovil.com/feedburner.xml", description: "Móviles en español", htmlUrl: "https://www.xatakamovil.com" },
    { title: "Muycomputer", xmlUrl: "https://www.muycomputer.com/feed/", description: "Hardware, software y tecnología", htmlUrl: "https://www.muycomputer.com" },
  ],
  "Programming": [
    { title: "Carlos Azaustre", xmlUrl: "https://carlosazaustre.es/rss.xml", description: "JavaScript y desarrollo web", htmlUrl: "https://carlosazaustre.es" },
    { title: "Genbeta Dev", xmlUrl: "https://www.genbeta.com/feedburner.xml", description: "Programación y desarrollo", htmlUrl: "https://www.genbeta.com" },
    { title: "Manz.dev", xmlUrl: "https://manz.dev/feed.xml", description: "Programación frontend", htmlUrl: "https://manz.dev" },
    { title: "Bitácora de Programación", xmlUrl: "https://www.arquitecturajava.com/feed/", description: "Java y arquitectura", htmlUrl: "https://www.arquitecturajava.com" },
  ],
  "Science": [
    { title: "Muy Interesante", xmlUrl: "https://www.muyinteresante.es/feed", description: "Ciencia y curiosidades", htmlUrl: "https://www.muyinteresante.es" },
    { title: "Naukas", xmlUrl: "https://naukas.com/feed/", description: "Divulgación científica en español", htmlUrl: "https://naukas.com" },
    { title: "Materia - El País", xmlUrl: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/ciencia/portada", description: "Ciencia en El País", htmlUrl: "https://elpais.com/ciencia/" },
    { title: "Investigación y Ciencia", xmlUrl: "https://www.investigacionyciencia.es/rss/actualidad.xml", description: "Scientific American en español", htmlUrl: "https://www.investigacionyciencia.es" },
    { title: "El País Ciencia", xmlUrl: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/section/ciencia/portada", description: "Noticias de ciencia", htmlUrl: "https://elpais.com/ciencia/" },
  ],
  "Space": [
    { title: "ESA Noticias", xmlUrl: "https://www.esa.int/rssfeed/Our_Activities/Space_Science", description: "Agencia Espacial Europea", htmlUrl: "https://www.esa.int" },
    { title: "Astrobitácora", xmlUrl: "https://astrobitacora.com/feed/", description: "Astronomía y astrofísica", htmlUrl: "https://astrobitacora.com" },
    { title: "Naukas Astronomía", xmlUrl: "https://naukas.com/tag/astronomia/feed/", description: "Astronomía en Naukas", htmlUrl: "https://naukas.com" },
  ],
  "Gaming": [
    { title: "3DJuegos", xmlUrl: "https://www.3djuegos.com/rss.php", description: "Videojuegos en español", htmlUrl: "https://www.3djuegos.com" },
    { title: "MeriStation", xmlUrl: "https://as.com/meristation/rss.xml", description: "Videojuegos y entretenimiento", htmlUrl: "https://as.com/meristation/" },
    { title: "Hobby Consolas", xmlUrl: "https://www.hobbyconsolas.com/rss.xml", description: "Videojuegos y consolas", htmlUrl: "https://www.hobbyconsolas.com" },
    { title: "Vandal", xmlUrl: "https://vandal.elespanol.com/rss.xml", description: "Noticias de videojuegos", htmlUrl: "https://vandal.elespanol.com" },
  ],
  "News": [
    { title: "El País", xmlUrl: "https://feeds.elpais.com/mrss-s/pages/ep/site/elpais.com/portada", description: "El periódico global en español", htmlUrl: "https://elpais.com" },
    { title: "El Confidencial", xmlUrl: "https://rss.elconfidencial.com/espana/", description: "Noticias de España", htmlUrl: "https://www.elconfidencial.com" },
    { title: "La Vanguardia", xmlUrl: "https://www.lavanguardia.com/rss/home.xml", description: "Noticias de actualidad", htmlUrl: "https://www.lavanguardia.com" },
    { title: "20minutos", xmlUrl: "https://www.20minutos.es/rss/", description: "Noticias de última hora", htmlUrl: "https://www.20minutos.es" },
    { title: "El Mundo", xmlUrl: "https://e00-elmundo.uecdn.es/elmundo/rss/portada.xml", description: "Noticias de España y el mundo", htmlUrl: "https://www.elmundo.es" },
    { title: "elDiario.es", xmlUrl: "https://www.eldiario.es/rss/", description: "Periodismo independiente", htmlUrl: "https://www.eldiario.es" },
    { title: "Público", xmlUrl: "https://www.publico.es/rss/", description: "Noticias con perspectiva", htmlUrl: "https://www.publico.es" },
    { title: "ABC", xmlUrl: "https://www.abc.es/rss/feeds/abc_ultima_hora.xml", description: "Noticias de última hora", htmlUrl: "https://www.abc.es" },
  ],
  "Business & Economy": [
    { title: "Expansión", xmlUrl: "https://e00-expansion.uecdn.es/rss/portada.xml", description: "Economía y mercados financieros", htmlUrl: "https://www.expansion.com" },
    { title: "El Economista", xmlUrl: "https://www.eleconomista.es/rss/rss-todo-el-contenido.php", description: "Economía y finanzas", htmlUrl: "https://www.eleconomista.es" },
    { title: "Cinco Días", xmlUrl: "https://cincodias.elpais.com/rss/cincodias/RSS_LOULTIMO.xml", description: "Economía y empresas", htmlUrl: "https://cincodias.elpais.com" },
    { title: "Economía Digital", xmlUrl: "https://www.economiadigital.es/feed/", description: "Economía digital y empresas", htmlUrl: "https://www.economiadigital.es" },
  ],
  "Movies": [
    { title: "Espinof", xmlUrl: "https://www.espinof.com/feed", description: "Cine y series en español", htmlUrl: "https://www.espinof.com" },
    { title: "Fotogramas", xmlUrl: "https://www.fotogramas.es/rss/", description: "La revista de cine", htmlUrl: "https://www.fotogramas.es" },
    { title: "SensaCine", xmlUrl: "https://www.sensacine.com/rss/", description: "Noticias de cine y series", htmlUrl: "https://www.sensacine.com" },
    { title: "Cine y Tele - El Mundo", xmlUrl: "https://e00-elmundo.uecdn.es/elmundo/rss/television.xml", description: "Cine y televisión", htmlUrl: "https://www.elmundo.es/television.html" },
  ],
  "Music": [
    { title: "Mondosonoro", xmlUrl: "https://www.mondosonoro.com/feed/", description: "Música alternativa e indie", htmlUrl: "https://www.mondosonoro.com" },
    { title: "Los40", xmlUrl: "https://los40.com/rss.xml", description: "Música y entretenimiento", htmlUrl: "https://los40.com" },
    { title: "Rockdelux", xmlUrl: "https://www.rockdelux.com/feed/", description: "Revista de música", htmlUrl: "https://www.rockdelux.com" },
  ],
  "Web Development": [
    { title: "Carlos Azaustre", xmlUrl: "https://carlosazaustre.es/rss.xml", description: "JavaScript y desarrollo web", htmlUrl: "https://carlosazaustre.es" },
    { title: "Manz.dev", xmlUrl: "https://manz.dev/feed.xml", description: "Frontend y CSS", htmlUrl: "https://manz.dev" },
    { title: "Xataka Developers", xmlUrl: "https://www.xataka.com/tag/desarrollo/feedburner.xml", description: "Desarrollo en Xataka", htmlUrl: "https://www.xataka.com" },
    { title: "Genbeta Dev", xmlUrl: "https://www.genbeta.com/feedburner.xml", description: "Desarrollo de software", htmlUrl: "https://www.genbeta.com" },
  ],
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  if (!category) return NextResponse.json({ error: "Missing category" }, { status: 400 });

  const feeds = FEEDS[category] ?? [];
  return NextResponse.json({ feeds }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
