// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { HiSparkles } from 'react-icons/hi';
import { FiFacebook, FiMessageCircle, FiMail, FiShield } from 'react-icons/fi';

const Footer = () => (
  <footer className="border-t border-white/5 bg-dark-900/50 mt-20">
    <div className="section-container py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <HiSparkles className="text-white text-lg" />
            </div>
            <span className="text-xl font-bold gradient-text">GameShop</span>
          </Link>
          <p className="text-white/50 text-sm leading-relaxed max-w-sm">
            Chuyên cung cấp tài khoản game uy tín và VPS chất lượng cao. 
            Giao dịch nhanh chóng, bảo hành rõ ràng, hỗ trợ 24/7 qua Zalo.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-primary-500/20 text-white/50 hover:text-primary-400 transition-all">
              <FiFacebook />
            </a>
            <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-green-500/20 text-white/50 hover:text-green-400 transition-all">
              <FiMessageCircle />
            </a>
            <a href="#" className="p-2 rounded-lg bg-white/5 hover:bg-accent-500/20 text-white/50 hover:text-accent-500 transition-all">
              <FiMail />
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <h4 className="text-white font-semibold mb-4">Sản Phẩm</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/products?type=game_account" className="hover:text-primary-400 transition-colors">Tài Khoản Game</Link></li>
            <li><Link to="/products?type=vps" className="hover:text-primary-400 transition-colors">VPS Hosting</Link></li>
            <li><Link to="/products" className="hover:text-primary-400 transition-colors">Tất Cả Sản Phẩm</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Hỗ Trợ</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/orders" className="hover:text-primary-400 transition-colors">Đơn Hàng Của Tôi</Link></li>
            <li><a href="#" className="hover:text-primary-400 transition-colors">Chính Sách Bảo Mật</a></li>
            <li><a href="#" className="hover:text-primary-400 transition-colors">Điều Khoản Dịch Vụ</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/30 text-sm">© 2025 GameShop. All rights reserved.</p>
        <div className="flex items-center gap-2 text-white/30 text-sm">
          <FiShield className="text-green-400" />
          <span>Giao dịch an toàn & bảo mật</span>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
