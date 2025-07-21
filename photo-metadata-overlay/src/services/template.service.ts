import { OverlaySettings, FrameSettings } from '../types';
import { storageService } from './storage.service';

/**
 * 预设模板接口
 */
export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'photography' | 'social' | 'professional' | 'artistic' | 'custom';
  overlaySettings: OverlaySettings;
  frameSettings: FrameSettings;
  thumbnail?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isBuiltIn: boolean;
  usageCount: number;
}

/**
 * 模板分类
 */
export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: PresetTemplate[];
}

/**
 * 智能推荐结果
 */
export interface SmartRecommendation {
  template: PresetTemplate;
  score: number;
  reason: string;
}

/**
 * 模板服务实现
 */
export class TemplateServiceImpl {
  private templates: Map<string, PresetTemplate> = new Map();
  private categories: Map<string, TemplateCategory> = new Map();
  private userPreferences: Map<string, number> = new Map();

  constructor() {
    this.initializeBuiltInTemplates();
    this.loadUserTemplates();
    this.loadUserPreferences();
  }

  /**
   * 获取所有模板
   */
  async getAllTemplates(): Promise<PresetTemplate[]> {
    return Array.from(this.templates.values());
  }

  /**
   * 根据分类获取模板
   */
  async getTemplatesByCategory(categoryId: string): Promise<PresetTemplate[]> {
    const category = this.categories.get(categoryId);
    return category ? category.templates : [];
  }

  /**
   * 获取模板分类
   */
  async getCategories(): Promise<TemplateCategory[]> {
    return Array.from(this.categories.values());
  }

  /**
   * 根据ID获取模板
   */
  async getTemplateById(id: string): Promise<PresetTemplate | null> {
    return this.templates.get(id) || null;
  }

  /**
   * 创建自定义模板
   */
  async createTemplate(
    name: string,
    description: string,
    overlaySettings: OverlaySettings,
    frameSettings: FrameSettings,
    tags: string[] = []
  ): Promise<PresetTemplate> {
    const template: PresetTemplate = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      category: 'custom',
      overlaySettings: { ...overlaySettings },
      frameSettings: { ...frameSettings },
      tags,
      createdAt: new Date(),
      updatedAt: new Date(),
      isBuiltIn: false,
      usageCount: 0,
    };

    this.templates.set(template.id, template);
    await this.saveUserTemplates();
    
    console.log(`创建自定义模板: ${name}`);
    return template;
  }

  /**
   * 更新模板
   */
  async updateTemplate(
    id: string,
    updates: Partial<Omit<PresetTemplate, 'id' | 'createdAt' | 'isBuiltIn'>>
  ): Promise<PresetTemplate | null> {
    const template = this.templates.get(id);
    if (!template || template.isBuiltIn) {
      return null;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      updatedAt: new Date(),
    };

    this.templates.set(id, updatedTemplate);
    await this.saveUserTemplates();
    
    console.log(`更新模板: ${updatedTemplate.name}`);
    return updatedTemplate;
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const template = this.templates.get(id);
    if (!template || template.isBuiltIn) {
      return false;
    }

    this.templates.delete(id);
    await this.saveUserTemplates();
    
    console.log(`删除模板: ${template.name}`);
    return true;
  }

  /**
   * 记录模板使用
   */
  async recordTemplateUsage(id: string): Promise<void> {
    const template = this.templates.get(id);
    if (template) {
      template.usageCount++;
      template.updatedAt = new Date();
      
      // 更新用户偏好
      const currentPreference = this.userPreferences.get(template.category) || 0;
      this.userPreferences.set(template.category, currentPreference + 1);
      
      await this.saveUserTemplates();
      await this.saveUserPreferences();
    }
  }

  /**
   * 智能推荐模板
   */
  async getSmartRecommendations(
    imageMetadata?: any,
    userHistory?: string[]
  ): Promise<SmartRecommendation[]> {
    const templates = Array.from(this.templates.values());
    const recommendations: SmartRecommendation[] = [];

    for (const template of templates) {
      let score = 0;
      let reasons: string[] = [];

      // 基于使用频率的评分
      if (template.usageCount > 0) {
        score += Math.min(template.usageCount * 0.1, 2);
        reasons.push('经常使用');
      }

      // 基于用户偏好的评分
      const categoryPreference = this.userPreferences.get(template.category) || 0;
      if (categoryPreference > 0) {
        score += Math.min(categoryPreference * 0.05, 1.5);
        reasons.push('符合偏好');
      }

      // 基于图像元数据的智能匹配
      if (imageMetadata) {
        const metadataScore = this.calculateMetadataScore(template, imageMetadata);
        score += metadataScore;
        if (metadataScore > 0.5) {
          reasons.push('适合图像类型');
        }
      }

      // 基于历史使用的评分
      if (userHistory && userHistory.includes(template.id)) {
        score += 1;
        reasons.push('最近使用');
      }

      // 新模板加分
      const daysSinceCreated = (Date.now() - template.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated < 7) {
        score += 0.5;
        reasons.push('新模板');
      }

      if (score > 0) {
        recommendations.push({
          template,
          score,
          reason: reasons.join(', '),
        });
      }
    }

    // 按评分排序并返回前10个
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * 搜索模板
   */
  async searchTemplates(query: string): Promise<PresetTemplate[]> {
    const lowerQuery = query.toLowerCase();
    const templates = Array.from(this.templates.values());

    return templates.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * 导出模板
   */
  async exportTemplate(id: string): Promise<string | null> {
    const template = this.templates.get(id);
    if (!template) {
      return null;
    }

    const exportData = {
      ...template,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 导入模板
   */
  async importTemplate(templateData: string): Promise<PresetTemplate | null> {
    try {
      const data = JSON.parse(templateData);
      
      // 验证模板数据
      if (!this.validateTemplateData(data)) {
        throw new Error('无效的模板数据格式');
      }

      const template: PresetTemplate = {
        ...data,
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isBuiltIn: false,
        usageCount: 0,
      };

      this.templates.set(template.id, template);
      await this.saveUserTemplates();
      
      console.log(`导入模板: ${template.name}`);
      return template;
    } catch (error) {
      console.error('导入模板失败:', error);
      return null;
    }
  }

  /**
   * 初始化内置模板
   */
  private initializeBuiltInTemplates(): void {
    const builtInTemplates: Omit<PresetTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>[] = [
      {
        name: '简约摄影',
        description: '简洁的元数据显示，适合专业摄影作品',
        category: 'photography',
        overlaySettings: {
          position: 'bottom-right',
          font: {
            family: 'Arial',
            size: 14,
            color: '#ffffff',
            weight: 'normal',
          },
          background: {
            color: '#000000',
            opacity: 0.6,
            padding: 8,
            borderRadius: 4,
          },
          displayItems: {
            brand: true,
            model: true,
            aperture: true,
            shutterSpeed: true,
            iso: true,
            timestamp: false,
            location: false,
            brandLogo: false,
          },
        },
        frameSettings: {
          enabled: false,
          style: 'simple',
          color: '#ffffff',
          width: 10,
          opacity: 1.0,
        },
        tags: ['简约', '专业', '摄影'],
        isBuiltIn: true,
      },
      {
        name: '社交媒体',
        description: '适合社交媒体分享的时尚设计',
        category: 'social',
        overlaySettings: {
          position: 'bottom-left',
          font: {
            family: 'Arial',
            size: 16,
            color: '#ffffff',
            weight: 'bold',
          },
          background: {
            color: '#000000',
            opacity: 0.8,
            padding: 12,
            borderRadius: 8,
          },
          displayItems: {
            brand: true,
            model: true,
            aperture: false,
            shutterSpeed: false,
            iso: false,
            timestamp: true,
            location: true,
            brandLogo: true,
          },
        },
        frameSettings: {
          enabled: true,
          style: 'shadow',
          color: '#ffffff',
          width: 15,
          opacity: 1.0,
          customProperties: {
            shadowBlur: 10,
            shadowOffset: { x: 0, y: 5 },
          },
        },
        tags: ['社交', '时尚', '分享'],
        isBuiltIn: true,
      },
      {
        name: '专业作品集',
        description: '专业摄影师作品集展示模板',
        category: 'professional',
        overlaySettings: {
          position: 'bottom-right',
          font: {
            family: 'Arial',
            size: 12,
            color: '#333333',
            weight: 'normal',
          },
          background: {
            color: '#ffffff',
            opacity: 0.9,
            padding: 10,
            borderRadius: 0,
          },
          displayItems: {
            brand: true,
            model: true,
            aperture: true,
            shutterSpeed: true,
            iso: true,
            timestamp: true,
            location: false,
            brandLogo: true,
          },
        },
        frameSettings: {
          enabled: true,
          style: 'simple',
          color: '#000000',
          width: 20,
          opacity: 1.0,
        },
        tags: ['专业', '作品集', '展示'],
        isBuiltIn: true,
      },
      {
        name: '艺术风格',
        description: '艺术摄影的创意展示模板',
        category: 'artistic',
        overlaySettings: {
          position: 'top-left',
          font: {
            family: 'Arial',
            size: 18,
            color: '#ffffff',
            weight: 'bold',
          },
          background: {
            color: '#000000',
            opacity: 0.7,
            padding: 15,
            borderRadius: 12,
          },
          displayItems: {
            brand: false,
            model: false,
            aperture: true,
            shutterSpeed: true,
            iso: true,
            timestamp: false,
            location: false,
            brandLogo: false,
          },
        },
        frameSettings: {
          enabled: true,
          style: 'vintage',
          color: '#8B4513',
          width: 25,
          opacity: 0.8,
        },
        tags: ['艺术', '创意', '复古'],
        isBuiltIn: true,
      },
      {
        name: '胶片风格',
        description: '模拟胶片摄影的怀旧效果',
        category: 'artistic',
        overlaySettings: {
          position: 'bottom-left',
          font: {
            family: 'Arial',
            size: 14,
            color: '#ffffff',
            weight: 'normal',
          },
          background: {
            color: '#000000',
            opacity: 0.5,
            padding: 8,
            borderRadius: 0,
          },
          displayItems: {
            brand: true,
            model: true,
            aperture: true,
            shutterSpeed: true,
            iso: true,
            timestamp: true,
            location: false,
            brandLogo: false,
          },
        },
        frameSettings: {
          enabled: true,
          style: 'film',
          color: '#000000',
          width: 30,
          opacity: 1.0,
        },
        tags: ['胶片', '怀旧', '复古'],
        isBuiltIn: true,
      },
    ];

    // 添加内置模板
    builtInTemplates.forEach((templateData, index) => {
      const template: PresetTemplate = {
        ...templateData,
        id: `builtin_${index + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
      };
      
      this.templates.set(template.id, template);
    });

    // 初始化分类
    this.initializeCategories();
  }

  /**
   * 初始化模板分类
   */
  private initializeCategories(): void {
    const categories = [
      {
        id: 'photography',
        name: '摄影专业',
        description: '专业摄影师使用的模板',
        icon: '📷',
      },
      {
        id: 'social',
        name: '社交媒体',
        description: '适合社交媒体分享的模板',
        icon: '📱',
      },
      {
        id: 'professional',
        name: '专业作品',
        description: '专业作品集和展示用模板',
        icon: '💼',
      },
      {
        id: 'artistic',
        name: '艺术创意',
        description: '艺术摄影和创意表达模板',
        icon: '🎨',
      },
      {
        id: 'custom',
        name: '自定义',
        description: '用户创建的自定义模板',
        icon: '⚙️',
      },
    ];

    categories.forEach(categoryData => {
      const templates = Array.from(this.templates.values())
        .filter(template => template.category === categoryData.id);
      
      const category: TemplateCategory = {
        ...categoryData,
        templates,
      };
      
      this.categories.set(category.id, category);
    });
  }

  /**
   * 计算元数据匹配评分
   */
  private calculateMetadataScore(template: PresetTemplate, metadata: any): number {
    let score = 0;

    // 根据图像类型匹配
    if (metadata.exif) {
      // 如果有相机信息，摄影类模板得分更高
      if (metadata.exif.make || metadata.exif.model) {
        if (template.category === 'photography' || template.category === 'professional') {
          score += 0.8;
        }
      }

      // 如果有GPS信息，社交媒体模板得分更高
      if (metadata.exif.gps) {
        if (template.category === 'social') {
          score += 0.6;
        }
      }

      // 根据拍摄参数判断是否为专业摄影
      const hasDetailedSettings = metadata.exif.aperture && metadata.exif.shutterSpeed && metadata.exif.iso;
      if (hasDetailedSettings) {
        if (template.category === 'photography' || template.category === 'professional') {
          score += 0.5;
        }
      }
    }

    // 根据文件名或路径判断类型
    if (metadata.fileName) {
      const fileName = metadata.fileName.toLowerCase();
      if (fileName.includes('art') || fileName.includes('creative')) {
        if (template.category === 'artistic') {
          score += 0.4;
        }
      }
      if (fileName.includes('social') || fileName.includes('share')) {
        if (template.category === 'social') {
          score += 0.4;
        }
      }
    }

    return Math.min(score, 2); // 最大评分为2
  }

  /**
   * 验证模板数据
   */
  private validateTemplateData(data: any): boolean {
    return (
      data &&
      typeof data.name === 'string' &&
      typeof data.description === 'string' &&
      typeof data.category === 'string' &&
      data.overlaySettings &&
      data.frameSettings &&
      Array.isArray(data.tags)
    );
  }

  /**
   * 保存用户模板
   */
  private async saveUserTemplates(): Promise<void> {
    const userTemplates = Array.from(this.templates.values())
      .filter(template => !template.isBuiltIn);
    
    try {
      await storageService.saveData('user_templates', userTemplates);
    } catch (error) {
      console.error('保存用户模板失败:', error);
    }
  }

  /**
   * 加载用户模板
   */
  private async loadUserTemplates(): Promise<void> {
    try {
      const userTemplates = await storageService.loadData('user_templates', []);
      userTemplates.forEach((template: PresetTemplate) => {
        this.templates.set(template.id, template);
      });
    } catch (error) {
      console.error('加载用户模板失败:', error);
    }
  }

  /**
   * 保存用户偏好
   */
  private async saveUserPreferences(): Promise<void> {
    try {
      const preferences = Object.fromEntries(this.userPreferences);
      await storageService.saveData('user_preferences', preferences);
    } catch (error) {
      console.error('保存用户偏好失败:', error);
    }
  }

  /**
   * 加载用户偏好
   */
  private async loadUserPreferences(): Promise<void> {
    try {
      const preferences = await storageService.loadData('user_preferences', {});
      this.userPreferences = new Map(Object.entries(preferences));
    } catch (error) {
      console.error('加载用户偏好失败:', error);
    }
  }
}

// 导出单例实例
export const templateService = new TemplateServiceImpl();