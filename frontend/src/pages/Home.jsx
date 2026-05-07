// src/pages/Home.jsx - Trang chủ
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import {
  FiShoppingCart, FiServer, FiShield, FiZap, FiStar,
  FiArrowRight, FiMessageCircle,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi';
import { FaGamepad } from 'react-icons/fa';

const StatCard = ({ icon: Icon, value, label, color }) => (
  <div className="glass-card p-5 text-center group hover:scale-105 transition-transform duration-300">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${color}`}>
      <Icon className="text-2xl text-white" />
    </div>
    <p className="text-2xl font-bold gradient-text">{value}</p>
    <p className="text-white/50 text-sm mt-1">{label}</p>
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="glass-card-hover p-6">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${color}`}>
      <Icon className="text-2xl text-white" />
    </div>
    <h3 className="text-white font-semibold mb-2">{title}</h3>
    <p className="text-white/50 text-sm leading-relaxed">{description}</p>
  </div>
);

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await productAPI.getAll({ limit: 4, sortBy: 'createdAt', sortOrder: 'desc' });
        setFeaturedProducts(res.data.data);
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        {/* BG decorations */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-600/5 rounded-full blur-3xl" />

        <div className="section-container relative text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-6 animate-fade-in">
            <HiSparkles className="text-accent-500" />
            Uy tín – Nhanh chóng – Bảo hành
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 animate-slide-up">
            <span className="text-white">Mua Ngay</span>
            <br />
            <span className="gradient-text">Account Game & VPS</span>
            <br />
            <span className="text-white/60 text-3xl sm:text-4xl font-bold">Chất Lượng Cao</span>
          </h1>

          <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10 animate-slide-up">
            Hệ thống cung cấp tài khoản game uy tín và VPS hiệu năng cao.
            Giao dịch nhanh qua Zalo, bảo hành rõ ràng, hỗ trợ 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link to="/products?type=game_account" className="btn-primary flex items-center justify-center gap-2 text-base py-3.5 px-8">
              <FaGamepad className="text-xl" /> Xem Game Account
            </Link>
            <Link to="/products?type=vps" className="btn-secondary flex items-center justify-center gap-2 text-base py-3.5 px-8">
              <FiServer className="text-xl" /> Xem VPS
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto animate-fade-in">
            <StatCard icon={FaGamepad} value="50+" label="Game Account" color="bg-gradient-to-br from-red-500 to-orange-500" />
            <StatCard icon={FiServer}  value="20+" label="VPS Plans"     color="bg-gradient-to-br from-primary-500 to-accent-500" />
            <StatCard icon={FiStar}    value="100+" label="Khách Hàng"   color="bg-gradient-to-br from-yellow-500 to-orange-500" />
            <StatCard icon={FiShield}  value="99%" label="Uy Tín"        color="bg-gradient-to-br from-green-500 to-teal-500" />
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section className="py-16 section-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Tại Sao Chọn Chúng Tôi?</h2>
          <p className="text-white/50">Cam kết chất lượng và trải nghiệm mua sắm tốt nhất</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard icon={FiShield}  color="bg-gradient-to-br from-green-500/80 to-teal-600/80"
            title="Bảo Hành Rõ Ràng" description="Mỗi sản phẩm đều có chính sách bảo hành cụ thể. Cam kết hoàn tiền nếu có lỗi từ phía chúng tôi." />
          <FeatureCard icon={FiZap}     color="bg-gradient-to-br from-yellow-500/80 to-orange-600/80"
            title="Giao Hàng Nhanh"  description="Nhận thông tin tài khoản ngay sau khi xác nhận đơn hàng. Nhanh nhất 5 phút qua Zalo." />
          <FeatureCard icon={FiMessageCircle} color="bg-gradient-to-br from-primary-500/80 to-accent-600/80"
            title="Hỗ Trợ 24/7"     description="Đội ngũ hỗ trợ luôn sẵn sàng qua Zalo. Giải quyết mọi vấn đề trong vòng 30 phút." />
          <FeatureCard icon={FiStar}   color="bg-gradient-to-br from-purple-500/80 to-pink-600/80"
            title="Uy Tín Hàng Đầu" description="Hơn 500+ đơn hàng thành công. Được khách hàng tin tưởng và đánh giá 5 sao." />
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────────────────── */}
      <section className="py-16 section-container">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Sản Phẩm Nổi Bật</h2>
            <p className="text-white/50">Các sản phẩm được yêu thích nhất</p>
          </div>
          <Link to="/products" className="flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium transition-colors group">
            Xem tất cả <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────────── */}
      <section className="py-16 section-container">
        <div className="relative rounded-3xl overflow-hidden p-10 text-center"
          style={{ background: 'linear-gradient(135deg, rgba(108,99,255,0.3) 0%, rgba(0,212,255,0.2) 100%)' }}>
          <div className="absolute inset-0 border border-white/10 rounded-3xl" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent" />
          <FiShoppingCart className="text-5xl text-white/20 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Sẵn Sàng Mua Sắm?</h2>
          <p className="text-white/60 mb-8 max-w-lg mx-auto">
            Thêm sản phẩm vào giỏ hàng và đặt lệnh — chúng tôi sẽ xác nhận qua Zalo trong vài phút!
          </p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2 text-base py-3.5 px-10">
            Mua Ngay <FiArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
