---
layout: layout.njk
title: Writing
permalink: /writing/
---

<p class="kicker">Blog</p>
<h1>Writing</h1>
<p class="lede">Dated posts. Add a Markdown file under <code>src/content/posts/</code>.</p>

{% if collections.posts.length %}
<ul class="item-list">
{% for post in collections.posts %}
  <li>
    <span class="meta">{{ post.date | readableDate }}</span>
    <a href="{{ post.url }}">{{ post.data.title }}</a>
  </li>
{% endfor %}
</ul>
{% else %}
<p class="empty">No posts yet.</p>
{% endif %}
