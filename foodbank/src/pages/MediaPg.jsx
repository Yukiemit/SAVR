import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ── When your backend is ready, replace these URLs ────────────
const API_ARTICLES_URL = "http://localhost:8000/api/media/articles";
const API_VIDEOS_URL   = "http://localhost:8000/api/media/videos";

// Fallback articles
const FALLBACK_ARTICLES = [
  {
    id: 1,
    title: "DOST-NRCP unveils research initiatives to combat food insecurity",
    excerpt:
      "As Filipinos face rising food prices and reports of crop shortages and smuggling, the Department of Science and Technology-National Research Council of the Philippines (DOST-NRCP) unveiled its efforts to ensure food and nutrition security for every Filipino. Dr. Leslie Michelle Dalmacho, president of the DOST-NRCP, underscored that researchers are exploring the country's rich biodiversity to improve crops through the latest technology and enhance the farm-to-market process.",
    image: "/images/media_article1.png",
    source: "Manila Bulletin",
    url: "https://mb.com.ph/2024/1/17/dost-nrcp-unveils-research-initiatives-to-combat-food-insecurity-1",
  },
  {
    id: 2,
    title: "Universal Food Security: This book says we already have the tools we need to solve world hunger",
    excerpt:
      "In Avengers: Infinity War, Thanos wanted to assemble the Infinity Gauntlet so he could eradicate half of all life in the universe because he claimed that genocide is what is needed to restore balance and to keep resources from being depleted by overpopulation. This was not his reason for doing so in the comic book, and people have since pointed out that if his only concern was resource depletion, why didn't he just snap his fingers and wish for either double the resources, or the repair of the broken systems that caused the depletion in the first place?",
    image: "/images/media_article2.png",
    source: "Manila Bulletin",
    url: "https://mb.com.ph/2023/11/28/universal-food-security-this-book-says-we-already-have-the-tools-we-need-to-solve-world-hunger",
  },
  {
    id: 3,
    title: "More Filipinos went hungry in 2nd quarter of 2023 — SWS",
    excerpt:
      "MANILA, Philippines — More Filipino families experienced involuntary hunger—or being hungry and not having anything to eat—at least once in the second quarter of 2023, a survey conducted by Social Weather Stations suggested. Results of the June 28 to July 1 survey found that 10.4% of Filipino families experienced involuntary hunger at least once in the past three months. It was up from 9.8% obtained in a survey in March.",
    image: "/images/media_article3.png",
    source: "Philstar",
    url: "https://www.philstar.com/headlines/2023/08/24/2290246/more-filipinos-went-hungry-2nd-quarter-2023-sws",
  },
  {
    id: 4,
    title: "DSWD's first food bank",
    excerpt:
      "The Department of Social Welfare and Development (DSWD) has launched its first food bank, a landmark initiative aimed at addressing food insecurity across the Philippines. The food bank serves as a centralized hub for collecting, storing, and distributing food donations to marginalized communities, orphanages, and other institutions in need.",
    image: "/images/media_article4.png",
    source: "Inquirer Opinion",
    url: "https://opinion.inquirer.net/179398/dswds-first-food-bank",
  },
];

// Fallback videos — YouTube embed IDs extracted from the URLs
const FALLBACK_VIDEOS = [
  {
    id: 1,
    title: "PH FoodBank Foundation – 2017 Annual Report",
    youtubeId: "2pEEU0qW5EQ",
  },
  {
    id: 2,
    title: "PH FoodBank Foundation – 2018 Annual Report",
    youtubeId: "4NogV1nIHls",
  },
  {
    id: 3,
    title: "PH FoodBank Foundation – 2019 Annual Report",
    youtubeId: "qBJzSiq-K98",
  },
  {
    id: 4,
    title: "DSWD's first food bank",
    youtubeId: "r800NEN-J9A",
  },
];

const ARTICLES_PER_PAGE = 3;
const VIDEOS_PER_PAGE   = 3;

export default function Media() {
  const [articles, setArticles]         = useState(FALLBACK_ARTICLES);
  const [videos, setVideos]             = useState(FALLBACK_VIDEOS);
  const [loadingArticles, setLoadingA]  = useState(true);
  const [loadingVideos, setLoadingV]    = useState(true);
  const [articlePage, setArticlePage]   = useState(1);
  const [videoPage, setVideoPage]       = useState(1);

  useEffect(() => {
    // Fetch articles
    const fetchArticles = async () => {
      try {
        const res = await fetch(API_ARTICLES_URL);
        if (!res.ok) throw new Error("API not ready");
        const json = await res.json();
        // Expects: { success: true, data: [{ id, title, excerpt, image, source, url }, ...] }
        if (json.success && Array.isArray(json.data)) setArticles(json.data);
      } catch {
        // Keep fallback
      } finally {
        setLoadingA(false);
      }
    };

    // Fetch videos
    const fetchVideos = async () => {
      try {
        const res = await fetch(API_VIDEOS_URL);
        if (!res.ok) throw new Error("API not ready");
        const json = await res.json();
        // Expects: { success: true, data: [{ id, title, youtubeId }, ...] }
        if (json.success && Array.isArray(json.data)) setVideos(json.data);
      } catch {
        // Keep fallback
      } finally {
        setLoadingV(false);
      }
    };

    fetchArticles();
    fetchVideos();
  }, []);

  // ── Pagination helpers ──────────────────────────────────────
  const totalArticlePages = Math.ceil(articles.length / ARTICLES_PER_PAGE);
  const totalVideoPages   = Math.ceil(videos.length / VIDEOS_PER_PAGE);

  const pagedArticles = articles.slice(
    (articlePage - 1) * ARTICLES_PER_PAGE,
    articlePage * ARTICLES_PER_PAGE
  );

  const pagedVideos = videos.slice(
    (videoPage - 1) * VIDEOS_PER_PAGE,
    videoPage * VIDEOS_PER_PAGE
  );

  const Pagination = ({ current, total, onChange }) => (
    <div className="media-pagination">
      <button onClick={() => onChange(1)} disabled={current === 1}>&lt;&lt;</button>
      <button onClick={() => onChange(current - 1)} disabled={current === 1}>PREVIOUS</button>
      {Array.from({ length: total }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={current === p ? "media-page-active" : ""}
        >
          {p}
        </button>
      ))}
      <button onClick={() => onChange(current + 1)} disabled={current === total}>NEXT</button>
      <button onClick={() => onChange(total)} disabled={current === total}>&gt;&gt;</button>
    </div>
  );

  return (
    <div>

      {/* NAVBAR */}
      <Navbar />

      {/* HERO */}
      <div className="hero media-hero">
        <div className="hero-overlay center">
          <h1 className="about-title">MEDIA</h1>
        </div>
      </div>

      {/* ARTICLES SECTION */}
      <section className="media-section">
        {loadingArticles ? (
          <p className="media-loading">Loading articles...</p>
        ) : (
          <>
            <div className="media-grid">
              {pagedArticles.map((article) => (
                <div className="media-card" key={article.id}>
                  <img
                    src={article.image}
                    alt={article.title}
                    className="media-card-img"
                    draggable={false}
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <div className="media-card-body">
                    <h3 className="media-card-title">{article.title}</h3>
                    <p className="media-card-excerpt">{article.excerpt}</p>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="media-read-more"
                    >
                      READ MORE
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {totalArticlePages > 1 && (
              <Pagination
                current={articlePage}
                total={totalArticlePages}
                onChange={setArticlePage}
              />
            )}
          </>
        )}
      </section>

      {/* DIVIDER */}
      <div className="media-divider-section">
        <h2 className="media-video-title">VIDEO ARTICLE</h2>
        <hr className="media-divider" />
      </div>

      {/* VIDEOS SECTION */}
      <section className="media-section">
        {loadingVideos ? (
          <p className="media-loading">Loading videos...</p>
        ) : (
          <>
            <div className="media-grid">
              {pagedVideos.map((video) => (
                <div className="media-video-card" key={video.id}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="media-iframe"
                  />
                </div>
              ))}
            </div>

            {totalVideoPages > 1 && (
              <Pagination
                current={videoPage}
                total={totalVideoPages}
                onChange={setVideoPage}
              />
            )}
          </>
        )}
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
