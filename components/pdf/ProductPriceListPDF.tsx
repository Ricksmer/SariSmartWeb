import path from "path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register embedded fonts with full Philippine Peso (₱ / \u20B1) glyph support
const regularFontPath = path.join(process.cwd(), "public/fonts/Arial-Regular.ttf");
const boldFontPath = path.join(process.cwd(), "public/fonts/Arial-Bold.ttf");
const italicFontPath = path.join(process.cwd(), "public/fonts/Arial-Italic.ttf");
const boldItalicFontPath = path.join(process.cwd(), "public/fonts/Arial-BoldItalic.ttf");

Font.register({
  family: "ArialCustom",
  fonts: [
    { src: regularFontPath, fontWeight: "normal", fontStyle: "normal" },
    { src: boldFontPath, fontWeight: "bold", fontStyle: "normal" },
    { src: italicFontPath, fontWeight: "normal", fontStyle: "italic" },
    { src: boldItalicFontPath, fontWeight: "bold", fontStyle: "italic" },
  ],
});

export type PDFRow = {
  name: string;
  brand: string | null;
  manufacturer?: string | null;
  unit: string | null;
  selling_price: number | null;
  remarks: string | null;
  category_name: string | null;
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "ArialCustom",
    fontSize: 9,
    color: "#1e293b",
    backgroundColor: "#ffffff",
  },
  // Running Page Header
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#1a7949",
    paddingBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  storeTitle: {
    fontSize: 18,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#0f472b",
    letterSpacing: 0.2,
  },
  storeSubtitle: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 3,
  },
  brandingBox: {
    alignItems: "flex-end",
  },
  brandTag: {
    fontSize: 11,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#1a7949",
    letterSpacing: 0.5,
  },
  dateTag: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  // Category Section
  categorySection: {
    marginTop: 10,
    marginBottom: 8,
  },
  categoryBanner: {
    backgroundColor: "#1a7949",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryTitle: {
    fontSize: 10,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryCount: {
    fontSize: 8,
    color: "#b7dec2",
  },
  // Table Header
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 2,
  },
  thItem: {
    flex: 3,
    fontSize: 8,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  thRemarks: {
    flex: 2,
    fontSize: 8,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#475569",
    textTransform: "uppercase",
  },
  thPrice: {
    width: 80,
    fontSize: 8,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#475569",
    textAlign: "right",
    textTransform: "uppercase",
  },
  // Table Row (wrap={false} on row prevents splitting an individual row across a page)
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 6,
    minHeight: 22,
  },
  rowEven: {
    backgroundColor: "#fcfdfd",
  },
  rowOdd: {
    backgroundColor: "#ffffff",
  },
  cellItem: {
    flex: 3,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingRight: 8,
  },
  itemName: {
    fontSize: 9.5,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#0f172a",
  },
  brandPrefix: {
    fontSize: 9.5,
    color: "#1a7949",
    fontFamily: "ArialCustom",
    fontWeight: "bold",
  },
  sizeTag: {
    fontSize: 8.5,
    fontFamily: "ArialCustom",
    color: "#047857",
    marginLeft: 3,
  },
  cellRemarks: {
    flex: 2,
    fontSize: 8,
    color: "#64748b",
    fontStyle: "italic",
    paddingRight: 6,
  },
  cellPrice: {
    width: 80,
    fontSize: 10,
    fontFamily: "ArialCustom",
    fontWeight: "bold",
    color: "#0f472b",
    textAlign: "right",
  },
  cellPriceTBD: {
    width: 80,
    fontSize: 9,
    fontFamily: "ArialCustom",
    color: "#d97706",
    textAlign: "right",
  },
  // Running Footer with Page Numbers
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 8,
    color: "#94a3b8",
  },
});

export default function ProductPriceListPDF({
  rows,
  storeName = "SariSmart Store",
}: {
  rows: PDFRow[];
  storeName?: string;
}) {
  const grouped = groupByCategory(rows);
  const totalItems = rows.length;

  return (
    <Document title={`${storeName} - Price List`}>
      <Page size="A4" style={styles.page}>
        {/* Document Running Header */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.storeTitle}>{storeName}</Text>
            <Text style={styles.storeSubtitle}>
              Official Store Price List &bull; {totalItems} {totalItems === 1 ? "Product" : "Products"}
            </Text>
          </View>
          <View style={styles.brandingBox}>
            <Text style={styles.brandTag}>SariSmart</Text>
            <Text style={styles.dateTag}>Generated {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Grouped Categories with Multi-Page Flow */}
        {grouped.map(([category, items]) => (
          <View key={category} style={styles.categorySection}>
            {/* Category Banner */}
            <View style={styles.categoryBanner} wrap={false}>
              <Text style={styles.categoryTitle}>{category}</Text>
              <Text style={styles.categoryCount}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </Text>
            </View>

            {/* Table Column Titles */}
            <View style={styles.tableHeader} wrap={false}>
              <Text style={styles.thItem}>Item Description</Text>
              <Text style={styles.thRemarks}>Remarks / Notes</Text>
              <Text style={styles.thPrice}>Retail Price</Text>
            </View>

            {/* Items inside Category */}
            {items.map((item, idx) => {
              const isEven = idx % 2 === 0;
              const formattedPrice =
                item.selling_price === null
                  ? "TBD"
                  : `\u20B1${item.selling_price.toFixed(2)}`;

              return (
                <View
                  key={idx}
                  wrap={false}
                  style={[styles.row, isEven ? styles.rowEven : styles.rowOdd]}
                >
                  <View style={styles.cellItem}>
                    <Text style={styles.itemName}>
                      {item.brand && (
                        <Text style={styles.brandPrefix}>{item.brand} - </Text>
                      )}
                      {item.name}
                      {item.unit && (
                        <Text style={styles.sizeTag}> ({item.unit})</Text>
                      )}
                    </Text>
                  </View>

                  <Text style={styles.cellRemarks}>{item.remarks || ""}</Text>

                  <Text
                    style={
                      item.selling_price === null
                        ? styles.cellPriceTBD
                        : styles.cellPrice
                    }
                  >
                    {formattedPrice}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}

        {/* Dynamic Running Footer with Page Numbers */}
        <View style={styles.footer} fixed>
          <Text>SariSmart Retail POS System &bull; Prices are subject to change without prior notice.</Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

function groupByCategory(rows: PDFRow[]): [string, PDFRow[]][] {
  const map = new Map<string, PDFRow[]>();
  for (const row of rows) {
    const key = row.category_name || "General Merchandise";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(row);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}
