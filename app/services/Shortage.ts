export function getShortageOrganizationUrl({
  shortageRoot,
  orgSlug,
}: {
  shortageRoot: string;
  orgSlug: string;
}) {
  return `${shortageRoot}${orgSlug}/`;
}

export function getShortageProductUrl({
  shortageRoot,
  orgSlug,
  productSlug,
}: {
  shortageRoot: string;
  orgSlug: string;
  productSlug: string;
}) {
  return `${shortageRoot}${orgSlug}/products/${productSlug}/`;
}
