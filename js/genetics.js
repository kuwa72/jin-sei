// genetics.js - 遺伝子と特性の管理

class Genetics {
    // 性格特性の名前を取得
    static getPersonalityTraitName(trait, value) {
        if (trait === 'extroversion') {
            if (value > 0.7) return '外向的';
            if (value < 0.3) return '内向的';
            return '平均的な社交性';
        } else if (trait === 'agreeableness') {
            if (value > 0.7) return '協調的';
            if (value < 0.3) return '自己主張が強い';
            return '平均的な協調性';
        }
        return '不明';
    }
    
    // 2つの個体間の相性を計算
    static calculateCompatibility(entity1, entity2) {
        // 外向性の補完性 (差が小さいほど良い)
        const extroversionMatch = 1 - Math.abs(entity1.extroversion - entity2.extroversion);
        
        // 協調性の補完性 (両方高いほど良い)
        const agreeablenessMatch = (entity1.agreeableness + entity2.agreeableness) / 2;
        
        // 総合的な相性スコア (0-1の範囲)
        return (extroversionMatch * 0.5 + agreeablenessMatch * 0.5);
    }
    
    // 子の特性を両親から継承
    static inheritTraits(child, parent1, parent2) {
        // 両親の特性の平均に若干のランダム変動を加える
        child.extroversion = (parent1.extroversion + parent2.extroversion) / 2 + (Math.random() - 0.5) * 0.2;
        child.agreeableness = (parent1.agreeableness + parent2.agreeableness) / 2 + (Math.random() - 0.5) * 0.2;
        
        // 0-1の範囲に収める
        child.extroversion = Math.max(0, Math.min(1, child.extroversion));
        child.agreeableness = Math.max(0, Math.min(1, child.agreeableness));
        
        // 寿命も若干継承される
        const parentAvgLifespan = (parent1.lifespan + parent2.lifespan) / 2;
        child.lifespan = Math.floor(parentAvgLifespan + (Math.random() - 0.5) * 10);
        child.lifespan = Math.max(60, Math.min(80, child.lifespan));
        
        return child;
    }
    
    // ランダムな特性を生成
    static generateRandomTraits() {
        return {
            extroversion: Math.random(),
            agreeableness: Math.random(),
            lifespan: 60 + Math.floor(Math.random() * 20)
        };
    }
    
    // 性格に基づく行動傾向を取得
    static getPersonalityBasedBehavior(entity) {
        const behavior = {
            movementSpeed: 0.5,
            directionChangeFrequency: 0.05,
            restFrequency: 0.01,
            socialDistance: 50,
            relationshipFormationChance: 0.1
        };
        
        // 外向性による影響
        behavior.movementSpeed += (entity.extroversion - 0.5) * 0.3; // 外向的なほど速く動く
        behavior.directionChangeFrequency += (entity.extroversion - 0.5) * 0.03; // 外向的なほど方向転換が多い
        behavior.restFrequency -= (entity.extroversion - 0.5) * 0.005; // 外向的なほど休息が少ない
        behavior.socialDistance -= (entity.extroversion - 0.5) * 20; // 外向的なほど近づく
        behavior.relationshipFormationChance += (entity.extroversion - 0.5) * 0.05; // 外向的なほど関係を形成しやすい
        
        // 協調性による影響
        behavior.relationshipFormationChance += (entity.agreeableness - 0.5) * 0.05; // 協調的なほど関係を形成しやすい
        
        // 値の範囲を制限
        behavior.movementSpeed = Math.max(0.2, Math.min(1.0, behavior.movementSpeed));
        behavior.directionChangeFrequency = Math.max(0.01, Math.min(0.1, behavior.directionChangeFrequency));
        behavior.restFrequency = Math.max(0.005, Math.min(0.02, behavior.restFrequency));
        behavior.socialDistance = Math.max(30, Math.min(70, behavior.socialDistance));
        behavior.relationshipFormationChance = Math.max(0.05, Math.min(0.2, behavior.relationshipFormationChance));
        
        return behavior;
    }
}
