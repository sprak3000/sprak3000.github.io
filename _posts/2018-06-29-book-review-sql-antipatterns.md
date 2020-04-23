---
permalink: /blog/2018/06/book-review-sql-antipatterns/
title: "Book Review: <em>SQL Antipatterns</em>"
last_modified_at: 2018-06-29T13:31:01-05:00
classes: wide
categories:
  - Blog
tags:
  - review
  - book
  - programming
  - sql
  - technology
---

![SQL Antipatterns](/assets/images/traackr/sql-antipatterns-book-cover.jpg){: .align-right}
SQL is an interesting yet temperamental tool in the programmer's kit. You can use it to find amazing insights in your
data, but you can watch a poorly formed query grind your application to a halt. [SQL Anitpatterns](https://amzn.to/2VMVx6M)
wants to help you avoid the latter by identifying common pitfalls when designing and using databases.

The book identifies twenty-four antipatterns and breaks each down in the same formula — an objective one is trying to
achieve, the antipattern typically used as a solution, how to spot this antipattern, the legitimate uses of the
antipattern, and alternative solutions. The author introduces each antipattern with a brief example scenario followed by
a summary of the objective people are typically trying to achieve.

Next, examples of the antipattern are given with an explanation of why you would not want to do this. Even with examples,
the author provides other ways to recognize the antipattern; most of these are questions you are likely to ask or hear
colleagues ask. If you hear or ask "How do I do X", that would be a good opportunity to pull this book off the shelf,
give it a quick skim, and possibly avoid a pitfall.

However, the author recognizes there are legitimate uses of each antipattern and presents them before the solutions to
avoid it. This allows you to decide if this is a pitfall to avoid or a necessary evil in your application. Finally, the
appropriate solutions are presented with attention given to how the solutions might differ between database vendors.

Easy to read and digest, this is the worthy [reference book](https://amzn.to/2VMVx6M) to add to your shelf. As you extend
or update a database and related application code, you will find yourself reaching for it to reduce the likelihood of
being paged at night by a misbehaving database.