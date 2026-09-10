# The support library: knowledge base and canned replies

Two records, both of them writing the desk reuses, and they are deliberately not the same
thing.

| | Knowledge base article | Canned reply |
| --- | --- | --- |
| Written to be | read on its own, by whoever has the question | dropped into a thread and then edited |
| Reaches | any signed-in colleague, through search | the agent's composer |
| Sent automatically | never — it is found | never — it is a starting point |

An article explains something. A snippet is the paragraph an agent is tired of retyping.
Collapsing the two would mean either publishing half-sentences or making people search
through boilerplate.

## Only published articles are searchable

`isPublished` exists so an article can be written before it is right. `searchKnowledgeBase`
filters on it, and there is a test that says so — a half-written answer reaching somebody
with a problem is worse than no answer at all, because they stop looking.

## One search, two audiences

`searchKnowledgeBase` is open to **any signed-in user**, not the support role. That is not a
loosened permission; it is the recognition that an agent hunting for the answer to paste and
an employee hunting for it themselves are the same search over the same published articles.
Restricting it would have meant writing it twice.

Ranking is a Mongo text index weighted to the title (10) over the summary (4) over the body
(1), so an article *about* VPNs beats one that mentions VPNs in passing.

**The index has to exist before the first search.** Mongoose builds it in the background
when the model is first used, so a search arriving early in a fresh deployment can beat it
and fail with *"text index required"*. `searchKnowledgeBase` awaits `KbArticleModel.init()`,
which resolves once and is cached, so the wait happens exactly once per boot. This was
caught by a test, not in production.

## The slug is typed, not derived

An article's `slug` is entered by hand rather than generated from the title. A slug is what
links point at, so it has to survive the title being reworded — deriving it would silently
break every link the day somebody improved the wording.

## Inserting a snippet appends; it never replaces

`CannedReplyPicker` adds the snippet's text to whatever is already in the message box rather
than overwriting it. An agent who has typed half an answer and then reaches for a snippet
wants both. Losing their words would be the last time they used the feature.

The picker renders nothing at all when the desk has saved no snippets, rather than an empty
dropdown that looks broken.

## Retiring, not deleting

A snippet has `isActive`: retired ones stay in the register but are not offered in the
composer, so a phrase the company has stopped using cannot be sent by accident while its
history stays readable.

## Where it shows up

- **Support → Knowledge Base** — the article register
- **Support → Canned Replies** — the snippet register
- **The reply composer** on any ticket — the Insert a canned reply picker
