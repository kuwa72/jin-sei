// renderer.js - 視覚化とレンダリング

class Renderer {
    constructor(simulation, canvas) {
        this.simulation = simulation;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.selectedEntity = null;
        this.infoPanel = document.getElementById('info-panel');
        this.statsElement = document.getElementById('stats');
        this.dayNightElement = document.getElementById('day-night');
    }
    
    // 描画処理
    render() {
        this.clearCanvas();
        this.drawBackground();
        this.drawEntities();
        this.drawRelationships();
        this.drawEvents();
        this.updateInfoPanel();
        this.updateStats();
        this.updateDayNightIndicator();
    }
    
    // キャンバスのクリア
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }
    
    // 背景の描画（昼夜サイクルを反映）
    drawBackground() {
        const cycle = this.simulation.dayNightCycle;
        let backgroundColor;
        
        if (cycle < 0.25) {
            // 朝（明るい青）
            backgroundColor = `rgb(200, 230, 255)`;
        } else if (cycle < 0.5) {
            // 昼（白っぽい青）
            backgroundColor = `rgb(220, 240, 255)`;
        } else if (cycle < 0.75) {
            // 夕方（オレンジがかった色）
            const r = 220 + Math.floor((cycle - 0.5) * 4 * 35);
            const g = 240 - Math.floor((cycle - 0.5) * 4 * 100);
            const b = 255 - Math.floor((cycle - 0.5) * 4 * 155);
            backgroundColor = `rgb(${r}, ${g}, ${b})`;
        } else {
            // 夜（暗い青）
            const factor = (cycle - 0.75) * 4; // 0-1
            const r = 255 - Math.floor(factor * 200);
            const g = 140 - Math.floor(factor * 100);
            const b = 100 + Math.floor(factor * 55);
            backgroundColor = `rgb(${r}, ${g}, ${b})`;
        }
        
        this.ctx.fillStyle = backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    // 個体の描画
    drawEntities() {
        for (const entity of this.simulation.entities) {
            if (entity.isDead) continue;
            
            // 個体の色
            const color = entity.color;
            const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;
            
            // 基本形状の描画
            this.ctx.beginPath();
            this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
            this.ctx.fillStyle = colorStr;
            this.ctx.fill();
            
            // 選択された個体の強調表示
            if (entity === this.selectedEntity) {
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
            
            // 性別の表示（小さなマーク）
            this.ctx.beginPath();
            if (entity.gender === 0) { // 女性
                this.ctx.arc(entity.x, entity.y - entity.size - 3, 2, 0, Math.PI * 2);
            } else { // 男性
                this.ctx.moveTo(entity.x - 2, entity.y - entity.size - 5);
                this.ctx.lineTo(entity.x + 2, entity.y - entity.size - 1);
                this.ctx.moveTo(entity.x + 2, entity.y - entity.size - 5);
                this.ctx.lineTo(entity.x - 2, entity.y - entity.size - 1);
            }
            this.ctx.strokeStyle = colorStr;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            
            // ライフステージの表示（輪郭の違い）
            if (entity.lifeStage === 0) { // 幼年期
                this.ctx.setLineDash([1, 1]);
                this.ctx.strokeStyle = colorStr;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            } else if (entity.lifeStage === 2) { // 老年期
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
            
            // 名前と年齢の表示（ファーストネームのみ）
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(`${entity.name.firstName} (${Math.floor(entity.age)})`, entity.x, entity.y - entity.size - 10);
        }
    }
    
    // 関係性の描画
    drawRelationships() {
        // パートナー関係の描画（結婚関係）
        for (const entity of this.simulation.entities) {
            if (entity.isDead || !entity.partner || entity.partner.isDead) continue;
            
            // 各個体は1回だけ関係線を描画（重複を避ける）
            if (entity.id < entity.partner.id) {
                this.ctx.beginPath();
                this.ctx.moveTo(entity.x, entity.y);
                this.ctx.lineTo(entity.partner.x, entity.partner.y);
                this.ctx.strokeStyle = 'rgba(255, 150, 150, 0.5)';
                this.ctx.lineWidth = 1;
                this.ctx.setLineDash([]); // 実線（結婚関係）
                this.ctx.stroke();
            }
        }
        
        // 恋愛関係の描画（ユーザー要望による追加）
        for (const entity of this.simulation.entities) {
            if (entity.isDead) continue;
            
            // 恋愛対象との関係線を描画
            for (const interest of entity.romanticInterests) {
                if (interest.isDead) continue;
                
                // 各関係は1回だけ描画（重複を避ける）
                if (entity.id < interest.id) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(entity.x, entity.y);
                    this.ctx.lineTo(interest.x, interest.y);
                    this.ctx.strokeStyle = 'rgba(255, 150, 150, 0.4)';
                    this.ctx.lineWidth = 1;
                    this.ctx.setLineDash([3, 3]); // 破線（恋愛関係）
                    this.ctx.stroke();
                    this.ctx.setLineDash([]); // 破線をリセット
                }
            }
        }
        
        // 親子関係の描画（選択された個体のみ）
        if (this.selectedEntity) {
            // 親への線
            for (const parent of this.selectedEntity.parents) {
                if (parent.isDead) continue;
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.selectedEntity.x, this.selectedEntity.y);
                this.ctx.lineTo(parent.x, parent.y);
                this.ctx.strokeStyle = 'rgba(150, 255, 150, 0.3)';
                this.ctx.setLineDash([2, 2]);
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            // 子への線
            for (const child of this.selectedEntity.children) {
                if (child.isDead) continue;
                
                this.ctx.beginPath();
                this.ctx.moveTo(this.selectedEntity.x, this.selectedEntity.y);
                this.ctx.lineTo(child.x, child.y);
                this.ctx.strokeStyle = 'rgba(150, 255, 150, 0.3)';
                this.ctx.setLineDash([2, 2]);
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
        }
    }
    
    // イベントの視覚的表現
    drawEvents() {
        const recentEvents = this.simulation.events.slice(-3); // 最新の3つのイベントのみ表示
        
        for (const event of recentEvents) {
            // イベント発生からの経過時間
            const timeSinceEvent = this.simulation.time - event.time;
            
            // 一定時間経過したイベントは表示しない
            if (timeSinceEvent > 50) continue;
            
            // 透明度（時間経過で徐々に消える）
            const alpha = Math.max(0, 1 - timeSinceEvent / 50);
            
            // イベントタイプに応じた表示
            if (event.type === 'birth' && event.entities.length > 0) {
                const child = event.entities[0];
                if (child.isDead) continue;
                
                // 出生イベント（輝き）
                this.ctx.beginPath();
                this.ctx.arc(child.x, child.y, child.size + 5, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 255, 150, ${alpha * 0.5})`;
                this.ctx.fill();
            } else if (event.type === 'relationship' && event.entities.length >= 2) {
                const entity1 = event.entities[0];
                const entity2 = event.entities[1];
                if (entity1.isDead || entity2.isDead) continue;
                
                // 関係形成イベント（ハート）
                const centerX = (entity1.x + entity2.x) / 2;
                const centerY = (entity1.y + entity2.y) / 2;
                
                this.ctx.fillStyle = `rgba(255, 150, 150, ${alpha})`;
                this.drawHeart(centerX, centerY, 5);
            } else if (event.type === 'death' && event.entities.length > 0) {
                const entity = event.entities[0];
                
                // 死亡イベント（十字）
                this.ctx.beginPath();
                this.ctx.moveTo(entity.x - 5, entity.y);
                this.ctx.lineTo(entity.x + 5, entity.y);
                this.ctx.moveTo(entity.x, entity.y - 5);
                this.ctx.lineTo(entity.x, entity.y + 5);
                this.ctx.strokeStyle = `rgba(100, 100, 100, ${alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }
    
    // ハートの描画
    drawHeart(x, y, size) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size / 2);
        
        // 左側の曲線
        this.ctx.bezierCurveTo(
            x - size, y - size,
            x - size, y + size / 3,
            x, y + size
        );
        
        // 右側の曲線
        this.ctx.bezierCurveTo(
            x + size, y + size / 3,
            x + size, y - size,
            x, y - size / 2
        );
        
        this.ctx.fill();
    }
    
    // 情報パネルの更新
    updateInfoPanel() {
        if (this.selectedEntity && !this.selectedEntity.isDead) {
            const info = this.selectedEntity.getInfoData();
            
            // 情報パネルの位置を個体の近くに設定
            const panelX = this.selectedEntity.x + 20;
            const panelY = this.selectedEntity.y - 20;
            
            // 画面外にはみ出さないように調整
            const panelWidth = 200;
            const panelHeight = 150;
            const adjustedX = Math.min(panelX, this.width - panelWidth - 10);
            const adjustedY = Math.min(panelY, this.height - panelHeight - 10);
            
            this.infoPanel.style.left = `${adjustedX}px`;
            this.infoPanel.style.top = `${adjustedY}px`;
            this.infoPanel.style.display = 'block';
            
            // 情報パネルの内容を設定
            this.infoPanel.innerHTML = `
                <strong>名前:</strong> ${info.name}<br>
                <strong>性別:</strong> ${info.gender}<br>
                <strong>年齢:</strong> ${info.age}<br>
                <strong>段階:</strong> ${info.lifeStage}<br>
                <strong>性格:</strong> ${info.personality}<br>
                <strong>状態:</strong> ${info.relationship}<br>
                <strong>子の数:</strong> ${info.children}
            `;
        } else {
            this.infoPanel.style.display = 'none';
        }
    }
    
    // 統計情報の更新
    updateStats() {
        const stats = this.simulation.statistics;
        const timeDisplay = Math.floor(this.simulation.time / 100); // 時間表示の単位を調整
        
        this.statsElement.textContent = `個体数: ${stats.population} | 時間: ${timeDisplay}`;
    }
    
    // 昼夜表示の更新
    updateDayNightIndicator() {
        const cycle = this.simulation.dayNightCycle;
        let timeOfDay;
        
        if (cycle < 0.25) {
            timeOfDay = '朝';
        } else if (cycle < 0.5) {
            timeOfDay = '昼';
        } else if (cycle < 0.75) {
            timeOfDay = '夕方';
        } else {
            timeOfDay = '夜';
        }
        
        this.dayNightElement.textContent = timeOfDay;
    }
    
    // 個体の選択
    selectEntityAt(x, y) {
        this.selectedEntity = this.simulation.findEntityAt(x, y);
        return this.selectedEntity;
    }
    
    // 選択解除
    clearSelection() {
        this.selectedEntity = null;
        this.infoPanel.style.display = 'none';
    }
}
