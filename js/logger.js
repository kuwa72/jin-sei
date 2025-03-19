// logger.js - ライフイベントログ管理

class Logger {
    constructor() {
        this.logContainer = document.getElementById('life-log');
        this.maxEntries = 100; // 最大ログエントリ数
    }
    
    // ログエントリの追加
    addLogEntry(message, type = 'normal') {
        // ログエントリ要素の作成
        const entry = document.createElement('div');
        entry.className = `log-entry log-${type}`;
        entry.textContent = message;
        
        // ログコンテナの先頭に追加（新しいエントリが上に表示される）
        this.logContainer.prepend(entry);
        
        // 最大エントリ数を超えた場合、古いエントリを削除
        while (this.logContainer.children.length > this.maxEntries) {
            this.logContainer.removeChild(this.logContainer.lastChild);
        }
    }
    
    // 誕生イベントのログ
    logBirth(child, parent1, parent2) {
        const message = `${child.name.firstName}が${parent1.name.firstName}と${parent2.name.firstName}の子として生まれました`;
        this.addLogEntry(message, 'birth');
    }
    
    // 死亡イベントのログ
    logDeath(entity) {
        let causes = ['事故', '突然死', '不明な病', '感染症'];
        let cause = causes[Math.floor(Math.random() * causes.length)];
        
        // 年齢に基づいた死因の決定
        switch (entity.lifestage) {
            case 0:
                // 若年死亡の場合
                causes = ['事故', '突然死', '不明な病', '感染症'];
                cause = causes[Math.floor(Math.random() * causes.length)];
                break;
            case 1:
                // 中年死亡の場合
                causes = ['病死', '心臓発作', '持病', '事故', '過労'];
                cause = causes[Math.floor(Math.random() * causes.length)];
                break;
            default:
                // 高齢だが寿命前の死亡
                causes = ['病死', '心臓発作', '肺炎', '衰弱'];
                cause = causes[Math.floor(Math.random() * causes.length)];
                break;
            
        }
        // それ以外は老衰（デフォルト）
        
        const message = `${entity.name.firstName}(${Math.floor(entity.age)})が亡くなりました（${cause}）`;
        this.addLogEntry(message, 'death');
    }
    
    // 恋愛イベントのログ（ユーザー要望により非表示）
    logRomance(entity1, entity2) {
        // 恋愛メッセージはログに表示しない
        // 視覚的表現はrenderer.jsで行う
        // log for debug
        //const message = `${entity1.name.firstName}(${Math.floor(entity1.age)})が${entity2.name.firstName}(${Math.floor(entity2.age)})に恋をした`;
        //this.addLogEntry(message, 'romance');
    }
    
    // 恋愛失敗イベントのログ（ユーザー要望により非表示）
    logRomanceFailed(entity1, entity2) {
        // 恋愛失敗メッセージはログに表示しない
        // 視覚的表現はrenderer.jsで行う
        // log for debug
        //const message = `${entity1.name.firstName}(${Math.floor(entity1.age)})の${entity2.name.firstName}(${Math.floor(entity2.age)})との恋は失敗した`;
        //this.addLogEntry(message, 'romance-failed');
    }
    
    // 結婚イベントのログ
    logMarriage(entity1, entity2) {
        const message = `${entity1.name.firstName}(${Math.floor(entity1.age)})と${entity2.name.firstName}(${Math.floor(entity2.age)})が結婚しました`;
        this.addLogEntry(message, 'marriage');
    }
    
    // 離婚イベントのログ
    logDivorce(entity1, entity2) {
        const message = `${entity1.name.firstName}(${Math.floor(entity1.age)})と${entity2.name.firstName}(${Math.floor(entity2.age)})が離婚しました`;
        this.addLogEntry(message, 'divorce');
    }
    
    // 時間経過のログ（定期的なメッセージ）
    logTimePassage(time) {
        // 一定間隔で時間経過メッセージを表示
        if (Math.floor(time / 500) > Math.floor((time - 1) / 500)) {
            const years = Math.floor(time / 100);
            const message = `${years}年が経過しました...時は容赦なく流れていきます`;
            this.addLogEntry(message, 'time');
        }
    }
}
