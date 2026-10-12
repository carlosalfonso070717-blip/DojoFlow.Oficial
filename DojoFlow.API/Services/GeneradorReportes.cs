using System.Globalization;
using ClosedXML.Excel;
using DojoFlow.Domain.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DojoFlow.API.Services
{
    public record DatosReporte(
        string Academia,
        string Moneda,
        string ColorPrimario,
        string MesAnio,
        RegistroFinanciero Resumen,
        List<Transaccion> Movimientos);

    // Reporte mensual de ingresos (cuotas y ventas) en PDF o Excel
    public static class GeneradorReportes
    {
        private static readonly CultureInfo Mx = CultureInfo.GetCultureInfo("es-MX");
        private const string Tinta = "#151619";
        private const string Suave = "#5b5e66";
        private const string Linea = "#e4e4e7";

        public static string NombreMes(string mesAnio)
        {
            var partes = mesAnio.Split('-');
            if (partes.Length != 2 || !int.TryParse(partes[0], out var mes) || mes < 1 || mes > 12) return mesAnio;
            var nombre = Mx.DateTimeFormat.GetMonthName(mes);
            return $"{char.ToUpper(nombre[0])}{nombre[1..]} {partes[1]}";
        }

        private static string Dinero(decimal monto) => monto.ToString("C2", Mx);

        // ===== PDF =====
        public static byte[] Pdf(DatosReporte d)
        {
            // Se configura aquí y no al arrancar: si la librería nativa de PDF no carga,
            // solo falla este reporte y no toda la API. Licencia Community: gratuita para
            // negocios con ingresos anuales menores a 1 millón de dólares.
            QuestPDF.Settings.License = LicenseType.Community;

            var acento = string.IsNullOrWhiteSpace(d.ColorPrimario) ? Tinta : d.ColorPrimario;
            var r = d.Resumen;

            return Document.Create(doc =>
            {
                doc.Page(pagina =>
                {
                    pagina.Size(PageSizes.Letter);
                    pagina.Margin(44);
                    pagina.DefaultTextStyle(t => t.FontSize(10).FontColor(Tinta));

                    pagina.Header().PaddingBottom(24).Row(fila =>
                    {
                        fila.RelativeItem().Column(c =>
                        {
                            c.Item().Text(d.Academia).FontSize(20).Bold();
                            c.Item().PaddingTop(2).Text($"Reporte de ingresos · {NombreMes(d.MesAnio)}").FontSize(11).FontColor(Suave);
                        });
                        fila.ConstantItem(6).Background(acento);
                    });

                    pagina.Content().Column(col =>
                    {
                        col.Spacing(20);

                        // Tarjetas de resumen
                        col.Item().Row(fila =>
                        {
                            fila.Spacing(10);
                            Tarjeta(fila.RelativeItem(), "Cuotas cobradas", Dinero(r.IngresosMensualidades));
                            Tarjeta(fila.RelativeItem(), $"Ventas ({r.VentasRealizadas})", Dinero(r.IngresosVentas));
                            Tarjeta(fila.RelativeItem(), "Total del mes", Dinero(r.Total), acento);
                        });

                        col.Item().Text("Movimientos").FontSize(13).Bold();

                        if (d.Movimientos.Count == 0)
                        {
                            col.Item().Background("#f4f4f5").Padding(14).Text(
                                "Este mes no tiene detalle de movimientos: se registró antes de que GestAcademy guardara cada cobro y venta. Los totales de arriba sí son correctos.")
                                .FontColor(Suave);
                            return;
                        }

                        col.Item().Table(tabla =>
                        {
                            tabla.ColumnsDefinition(c =>
                            {
                                c.ConstantColumn(78);
                                c.ConstantColumn(54);
                                c.RelativeColumn();
                                c.ConstantColumn(44);
                                c.ConstantColumn(86);
                            });

                            tabla.Header(h =>
                            {
                                foreach (var titulo in new[] { "Fecha", "Tipo", "Concepto", "Cant.", "Monto" })
                                {
                                    var celda = h.Cell().BorderBottom(1).BorderColor(Tinta).PaddingVertical(6);
                                    if (titulo is "Cant." or "Monto") celda.AlignRight().Text(titulo).Bold().FontSize(9);
                                    else celda.Text(titulo).Bold().FontSize(9);
                                }
                            });

                            foreach (var m in d.Movimientos)
                            {
                                Celda(tabla).Text(m.Fecha.ToString("dd MMM, HH:mm", Mx));
                                Celda(tabla).Text(m.Tipo == TipoTransaccion.Cuota ? "Cuota" : "Venta");
                                Celda(tabla).Text(m.Concepto);
                                Celda(tabla).AlignRight().Text(m.Cantidad.ToString(Mx));
                                Celda(tabla).AlignRight().Text(Dinero(m.Monto));
                            }

                            tabla.Footer(f =>
                            {
                                f.Cell().ColumnSpan(4).PaddingTop(8).AlignRight().Text("Total").Bold();
                                f.Cell().PaddingTop(8).AlignRight().Text(Dinero(d.Movimientos.Sum(m => m.Monto))).Bold();
                            });
                        });

                        var sinDetalle = r.Total - d.Movimientos.Sum(m => m.Monto);
                        if (sinDetalle > 0)
                        {
                            col.Item().Text(
                                $"{Dinero(sinDetalle)} de este mes se registraron antes de que GestAcademy guardara cada movimiento, por eso no aparecen en la tabla. El total del mes sí los incluye.")
                                .FontSize(9).FontColor(Suave);
                        }
                    });

                    pagina.Footer().Row(fila =>
                    {
                        fila.RelativeItem().Text($"Generado con GestAcademy el {DateTime.Now.ToString("d 'de' MMMM 'de' yyyy", Mx)}").FontSize(8).FontColor(Suave);
                        fila.ConstantItem(80).AlignRight().Text(t =>
                        {
                            t.DefaultTextStyle(s => s.FontSize(8).FontColor(Suave));
                            t.Span("Página ");
                            t.CurrentPageNumber();
                            t.Span(" de ");
                            t.TotalPages();
                        });
                    });
                });
            }).GeneratePdf();
        }

        private static void Tarjeta(IContainer contenedor, string etiqueta, string valor, string? acento = null)
        {
            contenedor.Background(acento ?? "#f4f4f5").Padding(14).Column(c =>
            {
                string colorTexto = acento == null ? Suave : "#ffffff";
                c.Item().Text(etiqueta).FontSize(9).FontColor(colorTexto);
                c.Item().PaddingTop(4).Text(valor).FontSize(16).Bold().FontColor(acento == null ? Tinta : "#ffffff");
            });
        }

        private static IContainer Celda(TableDescriptor tabla) =>
            tabla.Cell().BorderBottom(0.5f).BorderColor(Linea).PaddingVertical(6).PaddingRight(6);

        // ===== Excel =====
        public static byte[] Excel(DatosReporte d)
        {
            using var libro = new XLWorkbook();
            var formatoDinero = "\"$\"#,##0.00";
            var r = d.Resumen;

            var resumen = libro.Worksheets.Add("Resumen");
            resumen.Cell("A1").Value = d.Academia;
            resumen.Cell("A1").Style.Font.SetBold().Font.SetFontSize(16);
            resumen.Cell("A2").Value = $"Reporte de ingresos · {NombreMes(d.MesAnio)}";
            resumen.Cell("A2").Style.Font.SetFontColor(XLColor.FromHtml(Suave));

            var filas = new (string Concepto, object Valor)[]
            {
                ("Cuotas cobradas", r.IngresosMensualidades),
                ("Ventas", r.IngresosVentas),
                ("Piezas vendidas", r.VentasRealizadas),
                ("Total del mes", r.Total),
            };
            resumen.Cell("A4").Value = "Concepto";
            resumen.Cell("B4").Value = $"Monto ({d.Moneda})";
            resumen.Range("A4:B4").Style.Font.SetBold().Border.SetBottomBorder(XLBorderStyleValues.Thin);
            for (int i = 0; i < filas.Length; i++)
            {
                resumen.Cell(5 + i, 1).Value = filas[i].Concepto;
                var celda = resumen.Cell(5 + i, 2);
                if (filas[i].Valor is decimal monto)
                {
                    celda.Value = monto;
                    celda.Style.NumberFormat.Format = formatoDinero;
                }
                else celda.Value = Convert.ToInt32(filas[i].Valor);
            }
            resumen.Range(8, 1, 8, 2).Style.Font.SetBold().Border.SetTopBorder(XLBorderStyleValues.Thin);
            resumen.Columns(1, 2).AdjustToContents();

            var hoja = libro.Worksheets.Add("Movimientos");
            var encabezados = new[] { "Fecha", "Tipo", "Concepto", "Cantidad", $"Monto ({d.Moneda})" };
            for (int c = 0; c < encabezados.Length; c++) hoja.Cell(1, c + 1).Value = encabezados[c];
            var cabecera = hoja.Range(1, 1, 1, encabezados.Length);
            cabecera.Style.Font.SetBold().Fill.SetBackgroundColor(XLColor.FromHtml("#f4f4f5"));

            for (int i = 0; i < d.Movimientos.Count; i++)
            {
                var m = d.Movimientos[i];
                int fila = i + 2;
                hoja.Cell(fila, 1).Value = m.Fecha;
                hoja.Cell(fila, 1).Style.DateFormat.Format = "dd/mm/yyyy hh:mm";
                hoja.Cell(fila, 2).Value = m.Tipo == TipoTransaccion.Cuota ? "Cuota" : "Venta";
                hoja.Cell(fila, 3).Value = m.Concepto;
                hoja.Cell(fila, 4).Value = m.Cantidad;
                hoja.Cell(fila, 5).Value = m.Monto;
                hoja.Cell(fila, 5).Style.NumberFormat.Format = formatoDinero;
            }

            if (d.Movimientos.Count > 0)
            {
                int total = d.Movimientos.Count + 2;
                hoja.Cell(total, 4).Value = "Total";
                hoja.Cell(total, 5).FormulaA1 = $"SUM(E2:E{total - 1})";
                hoja.Cell(total, 5).Style.NumberFormat.Format = formatoDinero;
                hoja.Range(total, 4, total, 5).Style.Font.SetBold();
                hoja.Range(1, 1, total - 1, encabezados.Length).SetAutoFilter();

                var sinDetalle = r.Total - d.Movimientos.Sum(m => m.Monto);
                if (sinDetalle > 0)
                {
                    hoja.Cell(total + 2, 1).Value = $"Sin detalle: {sinDetalle.ToString("C2", Mx)} de este mes se registraron antes de que GestAcademy guardara cada movimiento.";
                    hoja.Cell(total + 2, 1).Style.Font.SetFontColor(XLColor.FromHtml(Suave));
                }
            }
            else
            {
                hoja.Cell(2, 1).Value = "Este mes se registró antes de que GestAcademy guardara el detalle de cada movimiento.";
            }

            hoja.SheetView.FreezeRows(1);
            hoja.Columns().AdjustToContents();

            using var flujo = new MemoryStream();
            libro.SaveAs(flujo);
            return flujo.ToArray();
        }
    }
}
