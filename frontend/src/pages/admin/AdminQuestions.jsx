// src/pages/admin/AdminQuestions.jsx - Quản lý câu hỏi Trivia + Import JSON
import { useCallback, useEffect, useRef, useState } from 'react';
import { triviaAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
  FiUpload, FiPlus, FiTrash2, FiRefreshCw, FiBookOpen, FiFileText,
} from 'react-icons/fi';
import Pagination from '../../components/Pagination';

const emptyForm = {
  topicId: '',
  question: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  difficulty: 'A1',
};

const emptyTopicForm = {
  name: '',
  description: '',
  slug: '',
};

const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/([^a-z0-9\s-]|_)+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export default function AdminQuestions() {
  const [topics, setTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [topicForm, setTopicForm] = useState(emptyTopicForm);
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [filterTopic, setFilterTopic] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const fileRef = useRef(null);

  const fetchData = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const [topicsRes, questionsRes] = await Promise.all([
        triviaAPI.getTopicsAdmin(),
        triviaAPI.getQuestions({
          page: p,
          limit: 15,
          ...(filterTopic ? { topicId: filterTopic } : {}),
        }),
      ]);
      setTopics(topicsRes.data.data || []);
      setQuestions(questionsRes.data.data || []);
      setTotalPages(questionsRes.data.pagination?.totalPages || 1);
      setPage(questionsRes.data.pagination?.page || 1);
      setTotalQuestions(questionsRes.data.pagination?.total || 0);
    } catch {
      toast.error('Không tải được dữ liệu câu hỏi');
    } finally {
      setLoading(false);
    }
  }, [filterTopic]);

  useEffect(() => {
    fetchData(page);
  }, [fetchData, page]);

  useEffect(() => {
    setPage(1);
  }, [filterTopic]);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const res = await triviaAPI.importQuestions(file);
      toast.success(res.data.message || 'Import thành công');
      fetchData(1);
    } catch (err) {
      const msg = err.response?.data?.message || 'Import thất bại';
      const errors = err.response?.data?.errors;
      toast.error(Array.isArray(errors) ? `${msg}: ${errors.slice(0, 3).join('; ')}` : msg);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await triviaAPI.createQuestion({
        ...form,
        options: form.options.map((o) => o.trim()),
      });
      toast.success('Thêm câu hỏi thành công');
      setForm(emptyForm);
      setShowForm(false);
      fetchData(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm câu hỏi');
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await triviaAPI.createTopic({
        name: topicForm.name.trim(),
        description: topicForm.description.trim(),
        slug: topicForm.slug.trim() || undefined,
      });
      toast.success('Thêm đề tài thành công');
      setTopicForm(emptyTopicForm);
      setShowTopicForm(false);
      fetchData(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm đề tài');
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Xóa đề tài này sẽ xóa tất cả câu hỏi thuộc đề tài này. Bạn có chắc chắn muốn xóa?')) return;
    try {
      await triviaAPI.deleteTopic(id);
      toast.success('Đã xóa đề tài');
      if (filterTopic === id) {
        setFilterTopic('');
      }
      fetchData(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa đề tài');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa câu hỏi này?')) return;
    try {
      await triviaAPI.deleteQuestion(id);
      toast.success('Đã xóa');
      fetchData(page);
    } catch {
      toast.error('Không thể xóa');
    }
  };

  const sampleJson = JSON.stringify(
    [
      {
        topicId: '<PASTE_TOPIC_ID_HERE>',
        question: 'What is the English word for "cái ghế"?',
        options: ['Chair', 'Table', 'Bed', 'Door'],
        correctIndex: 0,
        difficulty: 'A1',
      },
    ],
    null,
    2
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiBookOpen className="text-primary-400" /> Đố Vui Sinh Tồn
          </h1>
          <p className="text-white/50 text-sm mt-1">Quản lý đề tài & câu hỏi trắc nghiệm</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FiPlus /> Thêm câu hỏi
          </button>
          <button
            type="button"
            onClick={() => setShowTopicForm(true)}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <FiPlus /> Thêm đề tài
          </button>
          <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
            <FiUpload />
            {importing ? 'Đang import...' : 'Upload JSON File'}
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              disabled={importing}
              onChange={handleImport}
            />
          </label>
          <button type="button" onClick={() => fetchData(page)} className="btn-secondary p-2.5">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Import guide */}
      <div className="glass-card p-4 border border-primary-500/20">
        <p className="text-white/70 text-sm flex items-center gap-2 mb-2">
          <FiFileText className="text-accent-400" />
          Định dạng file JSON import (mảng câu hỏi):
        </p>
        <pre className="text-xs text-white/50 bg-black/30 rounded-lg p-3 overflow-x-auto">{sampleJson}</pre>
      </div>

      {/* Topics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {topics.map((t) => (
          <div key={t._id} className="glass-card p-4 relative group">
            <div className="pr-6">
              <p className="text-white font-semibold text-sm">{t.name}</p>
              <p className="text-white/40 text-xs mt-1">{t.description}</p>
              <p className="text-primary-400 text-[10px] mt-2 font-mono truncate">ID: {t._id}</p>
            </div>
            <button
              type="button"
              onClick={() => handleDeleteTopic(t._id)}
              className="absolute top-3 right-3 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Xóa đề tài"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <select
          value={filterTopic}
          onChange={(e) => setFilterTopic(e.target.value)}
          className="input-field max-w-xs text-sm"
        >
          <option value="">Tất cả đề tài</option>
          {topics.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
        <span className="text-white/40 text-sm">Tổng số: {totalQuestions} câu hỏi</span>
      </div>

      {/* Questions table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/40">Đang tải...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/50 text-left">
                  <th className="p-4">Câu hỏi</th>
                  <th className="p-4">Đề tài</th>
                  <th className="p-4">Đáp án đúng</th>
                  <th className="p-4 w-16" />
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="p-4 text-white max-w-md truncate">{q.question}</td>
                    <td className="p-4 text-white/60">{q.topicId?.name || '—'}</td>
                    <td className="p-4 text-green-400">{q.options?.[q.correctIndex]}</td>
                    <td className="p-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(q._id)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
                {questions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-white/40">
                      Chưa có câu hỏi. Hãy seed hoặc import JSON.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Add question modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <form
            onSubmit={handleCreate}
            className="relative glass-card p-6 w-full max-w-lg space-y-4 animate-scale-in"
          >
            <h2 className="text-lg font-bold text-white">Thêm câu hỏi mới</h2>

            <select
              required
              value={form.topicId}
              onChange={(e) => setForm({ ...form, topicId: e.target.value })}
              className="input-field w-full"
            >
              <option value="">Chọn đề tài</option>
              {topics.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>

            <textarea
              required
              rows={3}
              placeholder="Nội dung câu hỏi"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              className="input-field w-full resize-none"
            />

            {form.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctIndex"
                  checked={form.correctIndex === i}
                  onChange={() => setForm({ ...form, correctIndex: i })}
                  className="accent-primary-500"
                />
                <input
                  required
                  placeholder={`Đáp án ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const options = [...form.options];
                    options[i] = e.target.value;
                    setForm({ ...form, options });
                  }}
                  className="input-field flex-1"
                />
              </div>
            ))}

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
              <button type="submit" className="btn-primary">Lưu</button>
            </div>
          </form>
        </div>
      )}

      {/* Add topic modal */}
      {showTopicForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTopicForm(false)} />
          <form
            onSubmit={handleCreateTopic}
            className="relative glass-card p-6 w-full max-w-lg space-y-4 animate-scale-in"
          >
            <h2 className="text-lg font-bold text-white">Thêm đề tài mới</h2>

            <div className="space-y-1">
              <label className="text-xs text-white/60">Tên đề tài</label>
              <input
                required
                type="text"
                placeholder="Ví dụ: Từ vựng tiếng Anh"
                value={topicForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setTopicForm({
                    ...topicForm,
                    name: val,
                    slug: slugify(val),
                  });
                }}
                className="input-field w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/60">Slug (Đường dẫn tĩnh)</label>
              <input
                required
                type="text"
                placeholder="tu-vung-tieng-anh"
                value={topicForm.slug}
                onChange={(e) => setTopicForm({ ...topicForm, slug: e.target.value })}
                className="input-field w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/60">Mô tả</label>
              <textarea
                rows={3}
                placeholder="Mô tả tóm tắt nội dung đề tài..."
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                className="input-field w-full resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={() => setShowTopicForm(false)} className="btn-secondary">Hủy</button>
              <button type="submit" className="btn-primary">Lưu</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
