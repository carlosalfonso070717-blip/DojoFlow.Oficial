using System.Net;

namespace DojoFlow.API.Services
{
    // Correos transaccionales con código: tabla simple y estilos en línea para que se vean bien
    // en Gmail, Outlook y Apple Mail (los clientes de correo ignoran CSS externo y flexbox)
    public static class PlantillasCorreo
    {
        public static string Codigo(string titulo, string mensaje, string codigo, int minutosValidez, string? nota = null)
        {
            string t = WebUtility.HtmlEncode(titulo);
            string m = WebUtility.HtmlEncode(mensaje);
            string n = nota == null ? "" : WebUtility.HtmlEncode(nota);
            // El código se separa en dos bloques de tres para leerlo y dictarlo con facilidad
            string legible = codigo.Length == 6 ? $"{codigo[..3]}&nbsp;{codigo[3..]}" : WebUtility.HtmlEncode(codigo);

            return $@"<!doctype html>
<html lang=""es"">
<body style=""margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#151619;"">
  <div style=""display:none;max-height:0;overflow:hidden;"">Tu código es {codigo}. Vence en {minutosValidez} minutos.</div>
  <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""background:#f4f4f5;padding:40px 16px;"">
    <tr><td align=""center"">
      <table role=""presentation"" width=""100%"" cellpadding=""0"" cellspacing=""0"" style=""max-width:480px;background:#ffffff;border-radius:20px;padding:40px 32px;"">
        <tr><td style=""font-size:15px;font-weight:700;letter-spacing:-0.2px;padding-bottom:32px;"">GestAcademy</td></tr>
        <tr><td style=""font-size:26px;line-height:32px;font-weight:700;letter-spacing:-0.5px;padding-bottom:12px;"">{t}</td></tr>
        <tr><td style=""font-size:16px;line-height:24px;color:#5b5e66;padding-bottom:28px;"">{m}</td></tr>
        <tr><td align=""center"" style=""background:#f4f4f5;border-radius:14px;padding:22px 12px;font-size:36px;font-weight:700;letter-spacing:6px;font-variant-numeric:tabular-nums;"">{legible}</td></tr>
        <tr><td style=""font-size:14px;line-height:21px;color:#5b5e66;padding-top:24px;"">Vence en {minutosValidez} minutos. {n}</td></tr>
      </table>
      <p style=""font-size:12px;color:#8a8d94;padding-top:20px;margin:0;"">Recibiste este correo porque alguien usó esta dirección en DojoFlow.</p>
    </td></tr>
  </table>
</body>
</html>";
        }
    }
}
