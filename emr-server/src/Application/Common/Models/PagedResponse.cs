using System.Collections.Generic;

namespace Application.Common.Models;

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
}
