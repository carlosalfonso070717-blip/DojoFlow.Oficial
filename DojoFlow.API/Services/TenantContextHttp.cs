using DojoFlow.Application.Interfaces;

namespace DojoFlow.API.Services
{
    // Adaptador del puerto ITenantContext: la academia viaja dentro del JWT
    public class TenantContextHttp : ITenantContext
    {
        public const string ClaimAcademia = "academiaId";

        private readonly IHttpContextAccessor _httpContextAccessor;

        public TenantContextHttp(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid AcademiaId
        {
            get
            {
                var valor = _httpContextAccessor.HttpContext?.User.FindFirst(ClaimAcademia)?.Value;
                return Guid.TryParse(valor, out var id) ? id : Guid.Empty;
            }
        }
    }
}
