import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type Row = {
  name: string;
  brand: string | null;
  selling_price: number | null;
  remarks: string | null;
  category_name: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 2, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 9, color: "#666666", marginBottom: 18 },
  categoryHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
    marginBottom: 6,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.75,
    borderBottomColor: "#dddddd",
    paddingVertical: 6,
  },
  cellItem: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    paddingRight: 8,
  },
  cellPrice: {
    width: 90,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  cellRemarks: {
    width: 130,
    fontSize: 10,
    fontFamily: "Helvetica-Oblique",
    color: "#555555",
    textAlign: "left",
    paddingLeft: 10,
  },
  tbd: { color: "#b45309" },
});

export default function ProductPriceListPDF({
  rows,
  categoryLabel,
}: {
  rows: Row[];
  categoryLabel?: string;
}) {
  const grouped = groupByCategory(rows);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>SariSmart price list</Text>
        <Text style={styles.subtitle}>
          {categoryLabel ? categoryLabel : "All items"} · Generated{" "}
          {new Date().toLocaleDateString()}
        </Text>

        {grouped.map(([category, items]) => (
          <View key={category} wrap={false} style={{ marginBottom: 14 }}>
            <Text style={styles.categoryHeading}>{category}</Text>
            {items.map((item, i) => {
              const label = item.brand ? `${item.brand} - ${item.name}` : item.name;
              return (
                <View key={i} style={styles.row}>
                  <Text style={styles.cellItem}>{label}</Text>
                  <Text style={item.selling_price === null ? [styles.cellPrice, styles.tbd] : styles.cellPrice}>
                    {item.selling_price === null ? "TBD" : `\u20B1${item.selling_price.toFixed(2)}`}
                  </Text>
                  <Text style={styles.cellRemarks}>{item.remarks || ""}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
}

function groupByCategory(rows: Row[]): [string, Row[]][] {
  const map = new Map<string, Row[]>();
  for (const row of rows) {
    const key = row.category_name || "Uncategorized";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
