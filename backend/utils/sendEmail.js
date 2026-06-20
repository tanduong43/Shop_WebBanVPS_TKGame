const nodemailer = require('nodemailer');

const normalizeEnv = (value) => {
  let s = String(value ?? '').trim();
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const createMailTransporter = () => {
  const emailUser = normalizeEnv(process.env.EMAIL_USER).toLowerCase();
  let emailPass = normalizeEnv(process.env.EMAIL_PASS);
  emailPass = emailPass.replace(/\s+/g, '');

  if (!emailUser || !emailPass) {
    throw Object.assign(new Error('EMAIL_USER hoặc EMAIL_PASS chưa cấu hình'), { code: 'EMISSING' });
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: emailUser, pass: emailPass },
  });
};

const sendAdminDepositEmail = async (deposit, user, amount) => {
  try {
    const transporter = createMailTransporter();
    const adminEmail = process.env.ADMIN_EMAIL || normalizeEnv(process.env.EMAIL_USER).toLowerCase();

    const mailOptions = {
      from: normalizeEnv(process.env.EMAIL_USER).toLowerCase(),
      to: adminEmail,
      subject: `[Thông báo] User ${user.username} vừa nạp thành công ${amount.toLocaleString('vi-VN')} VNĐ`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #fff; border-radius: 10px;">
          <h2 style="color: #00d4ff; text-align: center;">Khách Hàng Nạp Tiền</h2>
          <p style="font-size: 16px;">User <strong>${user.username}</strong> (${user.email}) vừa nạp thành công:</p>
          <div style="background-color: #0d0d1a; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #00ff88;">+${amount.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <p style="font-size: 16px;"><strong>Mã giao dịch:</strong> ${deposit.orderCode}</p>
          <p style="font-size: 16px;"><strong>Phương thức:</strong> ${deposit.paymentMethod || 'Chuyển khoản / Banking'}</p>
          <p style="font-size: 16px;">Vui lòng kiểm tra lại trên hệ thống quản trị.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email thông báo nạp tiền tới Admin (${adminEmail})`);
  } catch (error) {
    console.error(`❌ Lỗi gửi email thông báo cho Admin:`, error.message);
  }
};

const sendAdminNewDepositEmail = async (deposit, user, amount) => {
  try {
    const transporter = createMailTransporter();
    const adminEmail = process.env.ADMIN_EMAIL || normalizeEnv(process.env.EMAIL_USER).toLowerCase();

    const mailOptions = {
      from: normalizeEnv(process.env.EMAIL_USER).toLowerCase(),
      to: adminEmail,
      subject: `[Thông báo] User ${user.username} vừa tạo lệnh nạp ${amount.toLocaleString('vi-VN')} VNĐ`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #fff; border-radius: 10px;">
          <h2 style="color: #ff9900; text-align: center;">Yêu Cầu Nạp Tiền Mới</h2>
          <p style="font-size: 16px;">User <strong>${user.username}</strong> (${user.email}) vừa tạo một lệnh nạp tiền:</p>
          <div style="background-color: #0d0d1a; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #ffcc00;">${amount.toLocaleString('vi-VN')} VNĐ</span>
          </div>
          <p style="font-size: 16px;"><strong>Mã giao dịch:</strong> ${deposit.orderCode}</p>
          <p style="font-size: 16px;"><strong>Nội dung CK:</strong> ${deposit.transferContent}</p>
          <p style="font-size: 16px;">Trạng thái hiện tại: <strong>CHỜ THANH TOÁN</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email thông báo tạo lệnh nạp tới Admin (${adminEmail})`);
  } catch (error) {
    console.error(`❌ Lỗi gửi email thông báo tạo lệnh nạp:`, error.message);
  }
};

const sendAdminNewOrderEmail = async (order, user) => {
  try {
    const transporter = createMailTransporter();
    const adminEmail = process.env.ADMIN_EMAIL || normalizeEnv(process.env.EMAIL_USER).toLowerCase();

    // Determine if this order contains any boosting services
    const isBoosting = order.items.some(item => item.type === 'boosting');
    const orderType = isBoosting ? 'Dịch vụ Treo Thuê' : 'Tài khoản Game/VPS';
    const color = isBoosting ? '#ff3366' : '#00d4ff';

    const itemHtml = order.items.map(item => {
      let detailsHtml = '';
      if (item.type === 'boosting') {
        const data = item.userProvidedData || {};
        detailsHtml = `
          <ul style="font-size: 14px; color: #ccc; margin-top: 5px;">
            <li>Tài khoản: ${data.username || 'N/A'}</li>
            <li>Server: ${data.server || 'N/A'}</li>
            <li>Thời gian: ${data.months || 1} tháng</li>
            <li>Ghi chú: ${data.note || 'Không có'}</li>
          </ul>
        `;
      }
      return `<li style="margin-bottom: 10px;"><strong>${item.name}</strong> x${item.quantity} - ${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ ${detailsHtml}</li>`;
    }).join('');

    const mailOptions = {
      from: normalizeEnv(process.env.EMAIL_USER).toLowerCase(),
      to: adminEmail,
      subject: `[Đơn hàng mới] User ${user.username} vừa thanh toán đơn hàng ${orderType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #fff; border-radius: 10px;">
          <h2 style="color: ${color}; text-align: center;">Đơn Hàng Mới: ${orderType}</h2>
          <p style="font-size: 16px;">User <strong>${user.username}</strong> (${user.email}) vừa thanh toán thành công đơn hàng:</p>
          <div style="background-color: #0d0d1a; padding: 15px; text-align: left; border-radius: 8px; margin: 20px 0;">
            <ul style="font-size: 16px; color: #00ff88; list-style-type: none; padding-left: 0;">
              ${itemHtml}
            </ul>
            <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
              <span style="font-size: 18px; color: #ffcc00;">Tổng tiền: ${order.totalPrice.toLocaleString('vi-VN')} VNĐ</span>
            </div>
          </div>
          <p style="font-size: 16px;">Vui lòng kiểm tra trên hệ thống quản trị để xử lý nếu cần thiết.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email thông báo đơn hàng mới tới Admin (${adminEmail})`);
  } catch (error) {
    console.error(`❌ Lỗi gửi email thông báo đơn hàng:`, error.message);
  }
};

const sendCustomerOrderInfoEmail = async (order, user, isUpdate = false) => {
  try {
    const transporter = createMailTransporter();

    // Build the items HTML with credentials
    const itemHtml = order.items.map(item => {
      let credsHtml = '';
      if (item.credentials && (item.credentials.username || item.credentials.ip)) {
        credsHtml = `
          <ul style="font-size: 14px; color: #ccc; margin-top: 5px; list-style: none; padding-left: 10px; border-left: 2px solid #00d4ff;">
            ${item.credentials.ip ? `<li><strong>IP/Host:</strong> ${item.credentials.ip}</li>` : ''}
            ${item.credentials.username ? `<li><strong>Tài khoản:</strong> ${item.credentials.username}</li>` : ''}
            ${item.credentials.password ? `<li><strong>Mật khẩu:</strong> ${item.credentials.password}</li>` : ''}
            ${item.credentials.server ? `<li><strong>Server:</strong> ${item.credentials.server}</li>` : ''}
            ${item.credentials.expiresAt ? `<li><strong>Hạn sử dụng:</strong> ${new Date(item.credentials.expiresAt).toLocaleDateString('vi-VN')}</li>` : ''}
          </ul>
        `;
      } else if (item.type === 'boosting') {
        credsHtml = `<p style="font-size: 14px; color: #ccc; margin-top: 5px;">Đơn treo thuê của bạn đang được xử lý.</p>`;
      }
      return `<li style="margin-bottom: 15px;">
        <strong>${item.name}</strong> x${item.quantity}
        ${credsHtml}
      </li>`;
    }).join('');

    const title = isUpdate ? 'Cập Nhật Thông Tin Dịch Vụ' : 'Thông Tin Dịch Vụ Của Bạn';
    const greetingMsg = isUpdate 
      ? `Chúng tôi xin lỗi vì sự bất tiện này. Thông tin cấp phát cho đơn hàng <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> của bạn đã được admin cập nhật. Dưới đây là thông tin chi tiết mới nhất:` 
      : `Đơn hàng <strong>#${order._id.toString().slice(-8).toUpperCase()}</strong> của bạn đã được admin xử lý. Dưới đây là thông tin chi tiết các dịch vụ/tài khoản:`;

    const mailOptions = {
      from: normalizeEnv(process.env.EMAIL_USER).toLowerCase(),
      to: user.email,
      subject: `[Thông báo đơn hàng] Chi tiết cấp phát dịch vụ cho đơn #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #1a1a2e; color: #fff; border-radius: 10px;">
          <h2 style="color: #00d4ff; text-align: center;">${title}</h2>
          <p style="font-size: 16px;">Xin chào <strong>${user.username}</strong>,</p>
          <p style="font-size: 16px;">${greetingMsg}</p>
          <div style="background-color: #0d0d1a; padding: 15px; text-align: left; border-radius: 8px; margin: 20px 0;">
            <ul style="font-size: 16px; color: #00ff88; list-style-type: none; padding-left: 0;">
              ${itemHtml}
            </ul>
          </div>
          ${order.adminNote ? `<p style="font-size: 16px; color: #ffcc00;"><strong>Ghi chú từ Admin:</strong> ${order.adminNote}</p>` : ''}
          <p style="font-size: 16px;">Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email thông tin đơn hàng tới khách hàng (${user.email})`);
  } catch (error) {
    console.error(`❌ Lỗi gửi email thông tin đơn hàng cho khách:`, error.message);
  }
};

module.exports = {
  createMailTransporter,
  sendAdminDepositEmail,
  sendAdminNewDepositEmail,
  sendAdminNewOrderEmail,
  sendCustomerOrderInfoEmail,
  normalizeEnv
};
