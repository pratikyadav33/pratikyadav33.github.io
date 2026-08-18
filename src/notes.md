---
layout: layout.njk
title: Notes
permalink: /notes/
---

<p class="kicker">Store</p>
<h1>Notes</h1>
<p class="lede">Evergreen pages, not a timeline. Add a Markdown file under <code>src/content/notes/</code>.</p>

{% if collections.notes.length %}
<ul class="item-list">
{% for note in collections.notes %}
  <li>
    <span class="meta">Note</span>
    <a href="{{ note.url }}">{{ note.data.title }}</a>
  </li>
{% endfor %}
</ul>
{% else %}
<p class="empty">No notes yet.</p>
{% endif %}
