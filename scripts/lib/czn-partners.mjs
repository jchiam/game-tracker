// Pure helpers for the Chaos Zero Nightmare Partner section of
// scripts/update-czn-data.mjs, split out so the source-shape and seed rules
// are unit-testable without the script's top-level env/ImageKit side effects.

/**
 * Locate the Partner nodes behind a Prydwen partners page-data payload. The
 * page-data lists taxonomy only; the nodes with images live in one of the
 * page's Gatsby static queries, whose hashes change per site build. Every
 * hash in `staticQueryHashes` is fetched in order and the first payload that
 * carries `allContentfulChaosPartner.nodes` wins. Throws (naming the endpoint)
 * when the page-data lists no hashes or no payload matches; warns, without
 * failing, when the page-data's own node count disagrees with the static
 * query's (both come from the same Contentful space and drift only mid-deploy).
 */
export async function selectPartnerNodes(pageData, { fetchStaticQuery, warn = console.warn }) {
  const listNodes = pageData?.result?.data?.allCharacters?.nodes;
  const hashes = pageData?.staticQueryHashes;
  if (!Array.isArray(hashes) || hashes.length === 0) {
    throw new Error('Prydwen partners page-data shape changed: staticQueryHashes missing/empty');
  }
  for (const hash of hashes) {
    const sq = await fetchStaticQuery(hash);
    const nodes = sq?.data?.allContentfulChaosPartner?.nodes;
    if (Array.isArray(nodes) && nodes.length > 0) {
      if (Array.isArray(listNodes) && listNodes.length !== nodes.length) {
        warn(
          `    Partner list page-data has ${listNodes.length} nodes but static query ${hash} has ${nodes.length}`,
        );
      }
      return nodes;
    }
  }
  throw new Error(
    `Prydwen partners static query shape changed: no payload among ${hashes.join(', ')} carries allContentfulChaosPartner.nodes`,
  );
}
