export const contents = {
  onboarding: {
    onboarding1: {
      title: "Quản lý tồn kho",
      description: "Kiểm soát hàng hóa dễ dàng, cập nhật tức thời.",
    },
    onboarding2: {
      title: "Báo cáo doanh thu",
      description: "Cập nhật kịp thời mọi lúc, mọi nơi.",
    },
    onboarding3: {
      title: "Quản lý tồn kho chính xác",
      description: "Kiểm soát hàng hóa dễ dàng, cập nhật tức thời.",
      tieptheo:'Tiếp theo ',
      boqua:'Bỏ qua',
      start:'Bắt đầu ngay '
    },
  },
  login: {
    username: 'username',
    password: 'password',
    username_required: 'Tài khoản không được để trống',
    password_required: 'Mật khẩu không được để trống',
    password_min_length: 'Mật khẩu phải có ít nhất 6 ký tự',
    password_pattern: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
    username_placeholder: 'Tài khoản',
    password_placeholder: 'Mật khẩu',
    password_placeholder1: 'Nhập mật khẩu mới ',
    password_placeholder2: 'Nhập lại mật khẩu mới',
    button_title: 'Đăng nhập',
    forgot_password: 'Quên mật khẩu?',
    username_error: 'Tài khoản không chính xác. Kiểm tra lại!',
    password_error: 'Mật khẩu không chính xác. Kiểm tra lại!',
    next : 'Tiếp tục'
  },
<<<<<<< HEAD

order:{
  createOrder: 'Tạo đơn hàng ',
  order: 'Đơn hàng ',
  donnhap:'Đơn nháp',
  return :'Trả hàng ',
  ship:'Vận đơn'
},

home:{
today:'Hôm nay',
week:'Tuần này',
month:'Tháng này',
doanhthuhomnay:'Doanh thu hôm nay ',
date:'19/11/2024',
price:'0đ',
soluong:'0',
gtridon:'Giá trị TB đơn ',
sldangban:'SL đang bán',
kquaKD:'Kết quả kinh doanh ',
},

xacminh:{
nhapma:'Nhập mã xác minh chúng tôi đã gửi tới',
phone:'+84 309290017',
guilai:'Gửi lại!',
}


=======
 menu:{
  title: 'Menu',
    account: {
      title: 'Tài khoản',
      name: 'Nguyễn Văn A',
      phone: '0398289916',
    },
    store: {
      title: 'Cửa hàng',
      name: 'SellSmart',
      website: 'www.sellsmart.com',
    },
    sections: {
      title: 'Khác',
      staff: 'Nhân viên',
      customer: 'Khách hàng',
      settings: 'Cấu hình',
    },
    logout: 'Đăng xuất',
 },
 staff: {
  title: 'Nhân viên',
  staff_id_label: '',
  phone_label: '',
  position_label: 'Chức vụ',
  employees: [
    {
      id: '#SH5832',
      name: 'Nguyễn Văn A',
      phone: '0398289917',
      position: 'Bán hàng',
      
    },
    {
      id: '#SH5833',
      name: 'Nguyễn Văn B',
      phone: '0398289918',
      position: 'Bán hàng',
     
    },
    {
      id: '#SH5834',
      name: 'Nguyễn Văn C',
      phone: '0398289919',
      position: 'Bán hàng',
      
    },
    {
      id: '#SH58355',
      name: 'Nguyễn Văn D',
      phone: '0398289919',
      position: 'Bán hàng',
      
    },
  ],
  toolbar: {
    add: '',
    filter: '',
    sort: '',
    search: '',
  },
},
addstaff:{
  text:'',
  title: 'Thêm nhân viên',
  show:'Thông tin nhân viên',
  id_staff:'Mã nhân viên',
  username:'Họ tên nhân viên',
  gender:'Giới tính',
  phone:'Số điện thoại',
  email:'Email',
  day:'Ngày sinh',
  address:'Địa chỉ',
  position:'Chức vụ',
id_required:'Id không được để trống',
username_required:'Họ tên nhân viên không được để trống',
phone_required:'Số điện thoại không được để trống',
email_required:'Email không được để trống',
day_required:'Ngày tháng năm sinh không được để trống',
adress_required:'Địa chỉ không được để trống',
username_length:'Tên không hợp lệ',
phone_length:'Số điện thoại không hợp lệ',
email_length:'Email không hợp lệ',
button_title: 'Lưu',
},
detailstaff:{
  title:'Thông tin chi tiết',
  id:'#CM9801',
  username:'Họ tên',
  gender:'Giới tính',
  phone:'Số điện thoại',
  email:'Email',
  bithDate:'Ngày sinh',
  address:'Địa chỉ',
position:'Chức vụ',
button_title: 'Xóa nhân viên',
},
updatestaff:{
  text:'',
  title: 'Cập nhật nhân viên',
  show:'Thông tin nhân viên',
  id_staff:'Mã nhân viên',
  username:'Họ tên nhân viên',
  gender:'Giới tính',
  phone:'Số điện thoại',
  email:'Email',
  day:'Ngày sinh',
  address:'Địa chỉ',
  position:'Chức vụ',
id_required:'Id không được để trống',
username_required:'Họ tên nhân viên không được để trống',
phone_required:'Số điện thoại không được để trống',
email_required:'Email không được để trống',
day_required:'Ngày tháng năm sinh không được để trống',
adress_required:'Địa chỉ không được để trống',
username_length:'Tên không hợp lệ',
phone_length:'Số điện thoại không hợp lệ',
email_length:'Email không hợp lệ',
button_title: 'Lưu',
},
customer:{
  title: 'Khách hàng',
  phone_label: '',
  employees: [
    {
      name: 'Nguyễn Văn A',
      phone: '0398289917',
    
    },
    {
      name: 'Nguyễn Văn B',
      phone: '0398289918',
      
     
    },
    {
      name: 'Nguyễn Văn C',
      phone: '0398289919',
    
      
    },
    {
      name: 'Nguyễn Văn D',
      phone: '0398289919',
      
      
    },
  ],
  toolbar: {
    add: '',
    filter: '',
    sort: '',
    search: '',
  },
},
addcustom:{
  text:'',
  title: 'Thêm khách hàng',
  show:'Thông tin khách hàng',
  username:'Họ tên khách hàng',
  gender:'Giới tính',
  phone:'Số điện thoại',
  email:'Email',
  day:'Ngày sinh',
  address:'Địa chỉ',
  position:'Chức vụ',
username_required:'Họ tên nhân viên không được để trống',
phone_required:'Số điện thoại không được để trống',
email_required:'Email không được để trống',
day_required:'Ngày tháng năm sinh không được để trống',
adress_required:'Địa chỉ không được để trống',
username_length:'Tên không hợp lệ',
phone_length:'Số điện thoại không hợp lệ',
email_length:'Email không hợp lệ',
button_title: 'Lưu',
},
detailcustomer:{
  title:'Thông tin chi tiết',
  id:'#CM9801',
  username:'Họ tên',
  gender:'Giới tính',
  phone:'Số điện thoại',
  email:'Email',
  bithDate:'Ngày sinh',
  address:'Địa chỉ',
button_title: 'Xóa khách hàng',
},
updatecustomer:{
  text:'',
  title: 'Cập nhật khách hàng',
  show:'Thông tin khách hàng',
  id_staff:'Mã khách hàng',
  username:'Họ tên khách hàng',
  gender:'Giới tính',
  phone:'Số điện thoại',
  email:'Email',
  day:'Ngày sinh',
  address:'Địa chỉ',
  position:'Chức vụ',
id_required:'Id không được để trống',
username_required:'Họ tên khách hàng không được để trống',
phone_required:'Số điện thoại không được để trống',
email_required:'Email không được để trống',
day_required:'Ngày tháng năm sinh không được để trống',
adress_required:'Địa chỉ không được để trống',
username_length:'Tên không hợp lệ',
phone_length:'Số điện thoại không hợp lệ',
email_length:'Email không hợp lệ',
button_title: 'Lưu',
},
config:{
  title: 'Cấu hình',
  background:'Giao diện',
  font:'Phông chữ',
  color:'Màu sắc',
  button_title: 'Lưu',
},
 notifications : {
  title: 'Thông báo',
    all: [
      {
        id: 1,
        icon: "home-outline",
        color: "#007AFF",
        title: "Chuyển khoản vào ngân hàng",
        time: "03:52:55 - 12/05",
        description: "MB Bank, 449287448743 (NGUYEN NGOC HA), 1.200.000đ, Đơn hàng DH_0948371",
      },
      {
        id: 2,
        icon: "wallet-outline",
        color: "#FFA500",
        title: "Đề nghị thanh toán",
        time: "03:52:55 - 12/05",
        description: "Customer Nguyễn Ngọc Minh has successfully paid for order #95111 with a value of 20.00 USD...",
      },
    ],
    promo: [],
    order: [],
  },
  notifi:{
title:'Thông báo',
titlee: "Chuyển khoản vào ngân hàng",
        time: "03:52:55 - 12/05",
        description: "MB Bank, 449287448743 (NGUYEN NGOC HA), 1.200.000đ, Đơn hàng DH_0948371",
        titleee: "Đề nghị thanh toán",
        timee: "03:52:55 - 12/05",
        descriptionn: "Customer Nguyễn Ngọc Minh has successfully paid for order #95111 with a value of 20.00 USD...",
  }
>>>>>>> 3cbe10814c328dd86256de046af4ba894fec51b1
};
