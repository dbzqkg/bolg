// ========== 个人博客配置文件 ==========

const BLOG_CONFIG = {
  // 所有资源路径默认以 assets/ 为根目录

  // 背景: type: 'color' | 'image' | 'gradient' | 'none'
  background: { type: 'image', value: 'img/back.png' },

  // 中心图片（path 留空则不显示，路径相对于 assets/）
  centerImage: { path: 'img/p5-teto-noback.png', alt: '中心图片' },

  // 环绕选项（4个）
  // label/link/image 留空 → 缺省值；angle: 0°=正前, 90°=正右, 180°=正后, 270°=正左
  menuItems: [
    { label: '文章', link: '', image: '', angle: 180, page: 'articles' },
    { label: '音乐', link: '', image: '', angle: 90, page: 'music' },
    { label: '关于', link: '', image: '', angle: 0, page: 'about' },
    { label: '更多', link: '', image: '', angle: 270, page: 'more' }
  ],

  // 页面内容（每个选项对应一个）
  pages: {
    articles: {
      title: '文章',
      subtitle: '阅读与记录',
      image: 'img/teto-read.png',
    },
    music: {
      title: '音乐',
      subtitle: '聆听与分享',
      image: '',
    },
    about: {
      title: '关于',
      subtitle: '这里是宫商角徵的个人博客',
      image: '',
    },
    more: {
      title: '更多',
      subtitle: '敬请期待',
      image: '',
    },
  },

  // 右下角展开面板
  infoPanel: {
    enabled: true,
    icon: 'img/miside.jpg',
    title: '欢迎来到「宫商角徵」的个人博客',
    content: '这里是一段正文内容。',
  },

  // 样式
  style: {
    ring: {
      tiltAngle: 25,          // 与水平面夹角（度），左上到右下倾斜
      radiusX: 25,            // 水平占视口 %
      radiusY: 25,            // 垂直占视口 %
      itemWidth: 252,
      itemHeight: 76
    },
    scrollSensitivity: 30
  }
};
