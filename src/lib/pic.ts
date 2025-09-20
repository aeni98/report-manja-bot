export const HSA_PIC_MAP: Record<string, string[]> = {
  "SA BANDA ACEH": ["@AZMY_BNA_19960192", "@Kilau02"],
  "SA BIREUEN": ["@Rony_Kurnia"],
  "SA DARUSSALAM": ["@YandaSfr", "@Rifqi_Saputra"],
  "SA LANGSA": ["@andika0207", "@Yudha_tama"],
  "SA LHOKSEUMAWE": ["@muhammadkamarullah", "@tayul90"],
  "SA MEULABOH": ["@Ridho_TTN_20910518", "@NurFadhli"],
  "SA SIGLI": ["@ctwop_885847"],
  "WILAYAH ACEH": ["@OFF3_PROV_ACEH_Ipan"],
};

export function formatPics(hsa: string): string {
  const pics = HSA_PIC_MAP[hsa];
  return pics?.length ? pics.join(" ") : "";
}
