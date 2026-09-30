# Engflex API (Control Plane)

Dịch vụ backend Go + Gin + GORM cho hệ thống Engflex-Ultimate.

## 1. Quickstart

```bash
# Tạo migration mới
make migration-create name=lesson

# Chạy migration
make migration-up

# Khởi chạy server API (chạy từ thư mục apps/api)
cd apps/api
go run cmd/server/main.go
```

---

## 2. Quy chuẩn Xử lý Lỗi (Error Handling)

Hệ thống sử dụng cơ chế xử lý lỗi tập trung tại `internal/common/errors.go` kết hợp với response envelope tại `internal/common/response.go`.

### 2.1. Cấu trúc `AppError` & Envelope phản hồi

Tất cả các lỗi trả về client đều được biểu diễn qua struct `AppError`:

```go
type AppError struct {
	Status  int    // HTTP status code (luôn dùng hằng số net/http, ví dụ http.StatusNotFound)
	Message string // Thông báo lỗi trả về cho client
}
```

Khi Controller gọi `common.Fail(c, err)`, client sẽ luôn nhận được định dạng JSON chuẩn:

```json
{
  "message": "<Nội dung lỗi>"
}
```

> **Lưu ý**: Bất kỳ lỗi nào không phải `*AppError` (hoặc lỗi chưa được phân loại) khi truyền vào `common.Fail` sẽ tự động chuyển thành **500 Internal Server Error** với thông báo `"Internal Server Error"` nhằm bảo mật thông tin nội bộ.

---

### 2.2. Các hàm tạo HTTP Error Helper

| Hàm | HTTP Status | Mục đích sử dụng | Ví dụ |
| :--- | :--- | :--- | :--- |
| `common.BadRequest(msg...)` | `400 Bad Request` | Tham số query/body không hợp lệ, validate thất bại | `common.BadRequest("name is required")` |
| `common.Unauthorized(msg...)` | `401 Unauthorized` | Không có hoặc token xác thực không hợp lệ | `common.Unauthorized()` |
| `common.Forbidden(msg...)` | `403 Forbidden` | Đã xác thực nhưng không đủ quyền hạn | `common.Forbidden("insufficient permissions")` |
| `common.NotFound(msg...)` | `404 Not Found` | Không tìm thấy tài nguyên | `common.NotFound("category not found")` |
| `common.Conflict(msg...)` | `409 Conflict` | Xung đột dữ liệu / trùng lặp khóa unique | `common.Conflict("category already exists")` |
| `common.UnprocessableEntity(msg...)` | `422 Unprocessable Entity` | Cú pháp hợp lệ nhưng vi phạm logic nghiệp vụ | `common.UnprocessableEntity("invalid step sequence")` |
| `common.TooManyRequests(msg...)` | `429 Too Many Requests` | Vượt quá giới hạn tần suất gọi API (Rate limit) | `common.TooManyRequests()` |
| `common.Internal(msg...)` | `500 Internal Server Error` | Lỗi máy chủ không mong muốn | `common.Internal()` |
| `common.ServiceUnavailable(msg...)` | `503 Service Unavailable` | Dịch vụ ngoài (AI Voice / Cloud) tạm thời gián đoạn | `common.ServiceUnavailable()` |

*(Tất cả các hàm trên đều nhận `msg ...string` tùy chọn; nếu bỏ trống sẽ tự động lấy mô tả mặc định của HTTP status).*

---

### 2.3. Lỗi ID sai định dạng: `InvalidIDError`

```go
type InvalidIDError struct {
	Name string // Ví dụ: "id", "categoryId", "attemptId"
}
```

Được trả về từ Repository khi chuỗi ID đầu vào không parse được (ví dụ UUID / Nanoid sai cú pháp), giúp chặn các truy vấn lỗi trước khi gửi xuống database.

---

### 2.4. Ánh xạ lỗi Database: `common.FromDBError`

Hàm `common.FromDBError(err, resourceName)` chuyển đổi tự động các lỗi database sang `*AppError`:

| Lỗi DB gốc | Quy đổi thành | HTTP Status | Output Message |
| :--- | :--- | :--- | :--- |
| `*InvalidIDError` | `BadRequest` | `400` | `"invalid <name>"` |
| `gorm.ErrRecordNotFound` | `NotFound` | `404` | `"<resource> not found"` |
| Postgres code `23505` (Unique violation) | `Conflict` | `409` | `"<resource> already exists"` |
| Postgres code `23503` (Foreign key violation) | `NotFound` | `404` | `"referenced <resource> not found"` |
| Các lỗi khác (Timeout, connection, v.v.) | `Internal` | `500` | `"Internal Server Error"` |

---

### 2.5. Luồng xử lý mẫu theo kiến trúc 3 tầng

#### 1. Repository (`repositories/`)
Thực hiện truy vấn thuần, trả về `*Model / []*Model` và `error` gốc (không xử lý HTTP hay nghiệp vụ tại đây):

```go
func (r *categoryRepo) GetByID(ctx context.Context, id uint) (*models.Category, error) {
	var category models.Category
	if err := r.db.WithContext(ctx).First(&category, "id = ?", id).Error; err != nil {
		return nil, err // Trả về gorm.ErrRecordNotFound hoặc DB error
	}
	return &category, nil
}
```

#### 2. Service (`services/`)
Nơi xử lý logic nghiệp vụ, chuyển đổi lỗi DB qua `FromDBError` và ghi log:
- **Thất bại**: dùng `logger.Report(ctx, "thông báo lỗi", appErr, "key", val)`
- **Thành công**: dùng `slog.InfoContext(ctx, "thông báo", "key", val)`

```go
func (s *categoryService) CreateCategory(ctx context.Context, req requests.CreateCategory) (*models.Category, error) {
	category := &models.Category{
		Name: req.Name,
	}
	err := s.repo.Create(ctx, category)
	if err != nil {
		appErr := common.FromDBError(err, "category")
		logger.Report(ctx, "failed to create category", appErr, "name", req.Name)
		return nil, appErr
	}

	slog.InfoContext(ctx, "category created", "category_id", category.ID)
	return category, nil
}
```

#### 3. Controller (`controllers/`)
Xử lý HTTP request/response. Trả lỗi qua `common.Fail(c, err)` và thành công qua `common.OK / Created / Paginated`:

```go
func (ctl *CategoryController) Create(c *gin.Context) {
	var req requests.CreateCategory
	if err := c.ShouldBindJSON(&req); err != nil {
		common.Fail(c, common.BadRequest(err.Error()))
		return
	}

	category, err := ctl.service.CreateCategory(c.Request.Context(), req)
	if err != nil {
		common.Fail(c, err)
		return
	}

	var dto responses.Category
	_ = utils.Map(&dto, category)
	common.Created(c, "category created successfully", dto)
}
```