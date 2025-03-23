// public/js/variants.js
const variantsData = window.variantsData || [];
let variantRows = [];

$(document).ready(() => {
    // Thêm tổ hợp biến thể đầu tiên khi trang tải
    addVariantRow();

    // Thêm biến thể
    $('#addVariantForm').submit(async function(event) {
        event.preventDefault();
        const name = $('#variantName').val().trim();
        const values = $('#variantValues').val().split(',').map(v => v.trim()).filter(v => v);
        if (!name || !values.length) {
            showErrorToast("Tên biến thể và ít nhất một giá trị là bắt buộc!");
            return;
        }

        const data = { name, values };
        try {
            const res = await $.ajax({
                url: '/products/getbienthe/create',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                beforeSend: function() {
                    $('#addVariantForm button[type="submit"]').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Đang xử lý...');
                }
            });
            if (res.status === 'Ok') {
                $('#addVariantModal').modal('hide');
                showSuccessToast("Thêm biến thể thành công!");
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            showErrorToast("Lỗi khi thêm biến thể: " + (error.responseJSON?.message || "Vui lòng thử lại!"));
        } finally {
            $('#addVariantForm button[type="submit"]').prop('disabled', false).html('Thêm biến thể');
        }
    });

    // Xóa biến thể
    window.deleteVariant = async function(id) {
        if (confirm('Bạn có chắc chắn muốn xóa biến thể này?')) {
            try {
                const res = await $.ajax({
                    url: `/products/getbienthe/delete/${id}`,
                    type: 'DELETE'
                });
                if (res.status === 'Ok') {
                    showSuccessToast("Xóa biến thể thành công!");
                    setTimeout(() => location.reload(), 1500);
                }
            } catch (error) {
                showErrorToast("Lỗi khi xóa biến thể: " + (error.responseJSON?.message || "Vui lòng thử lại!"));
            }
        }
    };

    // Chỉnh sửa biến thể
    window.editVariant = async function(id) {
        $('#editVariantId').val(id);
        try {
            const variantRes = await $.ajax({ url: '/products/getbienthejson', type: 'GET' });
            const currentVariant = variantRes.data.find(v => v._id === id);
            if (!currentVariant) throw new Error("Không tìm thấy biến thể!");

            $('#editVariantName').val(currentVariant.name || '');
            $('#editVariantValues').val(currentVariant.values?.join(', ') || '');

            const modal = new bootstrap.Modal(document.getElementById('editVariantModal'));
            modal.show();
        } catch (error) {
            showErrorToast("Lỗi khi tải dữ liệu: " + (error.message || "Vui lòng thử lại!"));
        }
    };

    // Cập nhật biến thể
    $('#editVariantForm').submit(async function(event) {
        event.preventDefault();
        const id = $('#editVariantId').val();
        const name = $('#editVariantName').val().trim();
        const values = $('#editVariantValues').val().split(',').map(v => v.trim()).filter(v => v);
        if (!name || !values.length) {
            showErrorToast("Tên biến thể và ít nhất một giá trị là bắt buộc!");
            return;
        }

        const data = { name, values };
        try {
            const res = await $.ajax({
                url: `/products/getbienthe/update/${id}`,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(data),
                beforeSend: function() {
                    $('#editVariantForm button[type="submit"]').prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> Đang xử lý...');
                }
            });
            if (res.status === 'Ok') {
                $('#editVariantModal').modal('hide');
                showSuccessToast("Cập nhật biến thể thành công!");
                setTimeout(() => location.reload(), 1500);
            }
        } catch (error) {
            showErrorToast("Lỗi khi cập nhật: " + (error.responseJSON?.message || "Vui lòng thử lại!"));
        } finally {
            $('#editVariantForm button[type="submit"]').prop('disabled', false).html('Lưu thay đổi');
        }
    });
});

// Thêm một hàng chọn biến thể
function addVariantRow() {
    const rowId = Date.now(); // ID duy nhất cho hàng
    let rowHtml = '<div class="variant-group" id="variant-row-' + rowId + '">';
    rowHtml += '<div class="variant-row">';

    // Tạo HTML cho các dropdown
    const selectHtml = variantsData.map(variant => {
        const options = variant.values.map(value => {
            return '<option value="' + value + '">' + value + '</option>';
        }).join('');
        return '<select class="form-control variant-value" data-variant-id="' + variant._id + '" data-row-id="' + rowId + '">' +
               '<option value="">Chọn ' + variant.name + '</option>' +
               options +
               '</select>';
    }).join('');
    rowHtml += selectHtml;

    // Thêm nút xóa
    rowHtml += '<button class="btn btn-danger btn-custom" onclick="removeVariantRow(' + rowId + ')">' +
               '<i class="fas fa-trash-alt"></i>' +
               '</button>';
    rowHtml += '</div></div>';

    $('#variantSelectionRows').append(rowHtml);
    variantRows.push(rowId);
}

// Xóa một hàng chọn biến thể
function removeVariantRow(rowId) {
    $(`#variant-row-${rowId}`).remove();
    variantRows = variantRows.filter(id => id !== rowId);
}

// Xác nhận chọn nhiều tổ hợp biến thể
window.confirmSelection = function() {
    const selectedVariants = [];

    variantRows.forEach(rowId => {
        const rowVariants = [];
        $(`#variant-row-${rowId} .variant-value`).each(function() {
            const variantId = $(this).data('variant-id');
            const value = $(this).val();
            if (value) {
                rowVariants.push({ variantId, value });
            }
        });
        if (rowVariants.length === variantsData.length) { // Đảm bảo tất cả biến thể trong hàng đều được chọn
            selectedVariants.push(rowVariants);
        }
    });

    if (selectedVariants.length > 0 && window.opener) {
        window.opener.postMessage({ selectedVariants }, '*');
        window.close();
    } else {
        showErrorToast("Vui lòng chọn đầy đủ giá trị cho ít nhất một tổ hợp biến thể!");
    }
};

// Hàm hiển thị toast
function showSuccessToast(message) {
    $('#successToast .toast-body').text(message);
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
}

function showErrorToast(message) {
    $('#errorToast .toast-body').text(message);
    const toast = new bootstrap.Toast(document.getElementById('errorToast'));
    toast.show();
}