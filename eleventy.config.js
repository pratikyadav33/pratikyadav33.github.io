export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/media");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/.nojekyll");

  eleventyConfig.addFilter("readableDate", (date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  });

  eleventyConfig.addShortcode("image", (src, alt = "", caption = "") => {
    const cap = caption ? `<figcaption>${caption}</figcaption>` : "";
    return `<figure class="embed embed--image"><img src="${src}" alt="${alt}">${cap}</figure>`;
  });

  eleventyConfig.addShortcode("video", (src, caption = "") => {
    const cap = caption ? `<figcaption>${caption}</figcaption>` : "";
    return `<figure class="embed embed--video"><video src="${src}" controls playsinline></video>${cap}</figure>`;
  });

  eleventyConfig.addShortcode("youtube", (id, title = "YouTube video") => {
    return `<figure class="embed embed--video"><iframe src="https://www.youtube.com/embed/${id}" title="${title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></figure>`;
  });

  eleventyConfig.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("./src/content/posts/*.md")
      .filter((item) => !item.data.draft)
      .sort((a, b) => b.date - a.date)
  );

  eleventyConfig.addCollection("notes", (api) =>
    api
      .getFilteredByGlob("./src/content/notes/*.md")
      .filter((item) => !item.data.draft)
      .sort((a, b) => String(a.data.title).localeCompare(String(b.data.title)))
  );

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"],
  };
}
