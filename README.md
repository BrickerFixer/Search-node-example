# Index search node

A node for Index federated search engine.

Early release. Contains lots of hardcode. Be aware.

## Health

Return health stat, timestamp, uptime

## Metadata

Return node name, description, features, methods of search 

## Search

Needs: Query, search method, user ranking preferences.

Return a ranked list of search answers (name, domain, url, snippet, favicon), with html layout and islands.

# Search method

A thing that gives search results to the node itself. Is located in a separate js file.

## Contains:

- A search algorithm (yk, a source of information)
- A ranking algorithm (the one that’s activated by default, and can be modified by user’s ranking preference)
- An HTML layout (optional, if it returns the default text search results)
- List of interactive search blocks called Islands. (optional if none are needed)

# Island

An interactive search block that’s a js file that gets sent to the frontend. Always gets called by search method for a checkup whether it matches the island's needed data. if yes, gets sent to frontend and injected to the page. OR it can be called directly to render, ignoring every requirement by the island spec (for example, IF a search method is intelligently managed by AI or some other algorithm! Just for further algorithm extensibility)

## Island variables

- Unique island ID
export const id = "test";
- Display name of your island
export const name = "Test";
- Trigger that makes your island appear ("query" that user typed in, "domain" or url of some search result, "content" in search snippet, "self"-trigger based on shouldRender function)
export const trigger_type = "query";
- keyword that triggers island's appearance
export const keywords = ["test island block"];
- Does island need something to narrow the information shown?
For example, if you are making a weather island, context is the city where you want the weather to be pulled from
export const require_context = false;
- Is information manually curated by a person or automatically pulled from certain sources? Do we inject a warning there that info might be false?
export const manually_curated = true;
- Column where island will display at in the frontend main (left) or supporting (right)
export const column = "supporting";

## Methods of rendering

- shouldRender
Needed if island has the “self” trigger type.
- renderIsland
Obviously needed, so the island will show its contents

## Parameters

- keyword
Thing that triggered the island’s appearance
- context
Thing that’ll narrow down the scope of information (basically when you search “weather in ***Moscow***”, it’ll give you weather in ***Moscow***) Basically it is everything that isn’t a keyword.
