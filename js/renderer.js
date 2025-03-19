// renderer.js - 視覚化とレンダリング

class Renderer {
	constructor(simulation, canvas) {
		this.simulation = simulation;
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		this.width = canvas.width;
		this.height = canvas.height;
		this.selectedEntity = null;
		this.infoPanel = document.getElementById("info-panel");
		this.statsElement = document.getElementById("stats");
		this.dayNightElement = document.getElementById("day-night");

		// パーティクル用のマップを初期化（キー: "entityId1_entityId2", 値: パーティクル配列）
		this.particleMap = new Map();
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

	// 背景色に基づいて適切な文字色を計算
	calculateTextColor(bgR, bgG, bgB) {
		// 背景色の輝度を計算（YIQ形式）
		// const yiq = (bgR * 299 + bgG * 587 + bgB * 114) / 1000;
		// 輝度に基づいて白または黒を返す
		// return yiq >= 128 ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)";
		// 色の切り替わり時に目がチカチカするので白固定で
		return "rgba(255, 255, 255, 0.8)";
	}

	// 背景の描画（昼夜サイクルを反映）
	drawBackground() {
		const cycle = this.simulation.dayNightCycle;
		const time = this.simulation.time;
		let bgR = 0;
		let bgG = 0;
		let bgB = 0;

		// 時間帯ごとの基本色を定義
		const colors = {
			dawn: { r: 200, g: 230, b: 255 }, // 朝
			day: { r: 220, g: 240, b: 255 }, // 昼
			dusk: { r: 255, g: 140, b: 100 }, // 夕方
			night: { r: 55, g: 40, b: 155 }, // 夜
		};

		// 現在の時間帯に応じて色を補間
		let color1 = null;
		let color2 = null;
		let t = 0;

		if (cycle < 0.25) {
			// 夜明け: 夜→朝
			color1 = colors.night;
			color2 = colors.dawn;
			t = cycle * 4;
		} else if (cycle < 0.5) {
			// 朝→昼
			color1 = colors.dawn;
			color2 = colors.day;
			t = (cycle - 0.25) * 4;
		} else if (cycle < 0.75) {
			// 昼→夕方
			color1 = colors.day;
			color2 = colors.dusk;
			t = (cycle - 0.5) * 4;
		} else {
			// 夕方→夜
			color1 = colors.dusk;
			color2 = colors.night;
			t = (cycle - 0.75) * 4;
		}

		// イージング関数を適用してスムーズな遷移を実現
		t = (1 - Math.cos(t * Math.PI)) / 2;

		// 色を補間
		bgR = Math.floor(color1.r + (color2.r - color1.r) * t);
		bgG = Math.floor(color1.g + (color2.g - color1.g) * t);
		bgB = Math.floor(color1.b + (color2.b - color1.b) * t);

		// 背景のアニメーション
		const offsetX = Math.sin(time * 0.001) * 10;
		const offsetY = Math.cos(time * 0.001) * 10;

		// グラデーションを作成
		const gradient = this.ctx.createLinearGradient(
			offsetX,
			offsetY,
			this.width + offsetX,
			this.height + offsetY,
		);
		gradient.addColorStop(0, `rgb(${bgR}, ${bgG}, ${bgB})`);
		gradient.addColorStop(1, `rgb(${bgR - 20}, ${bgG - 20}, ${bgB - 20})`);

		// 背景の基本色
		this.ctx.fillStyle = gradient;
		this.ctx.fillRect(0, 0, this.width, this.height);

		// 現在の背景色を保存（文字色の計算用）
		this.currentBgColor = { r: bgR, g: bgG, b: bgB };

		// 夜の場合は星を描画
		if (cycle >= 0.75) {
			const starCount = 100;
			const starAlpha = (cycle - 0.75) * 4; // 0-1

			for (let i = 0; i < starCount; i++) {
				const x = (Math.sin(i * 567.89) * 0.5 + 0.5) * this.width;
				const y = (Math.cos(i * 123.45) * 0.5 + 0.5) * this.height;
				const size = (Math.sin(i * 789.12) * 0.5 + 0.5) * 2 + 1;
				const twinkle =
					Math.sin(this.simulation.time * 2 + i * 345.67) * 0.5 + 0.5;

				this.ctx.beginPath();
				this.ctx.arc(x, y, size, 0, Math.PI * 2);
				this.ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * twinkle * 0.8})`;
				this.ctx.fill();
			}
		}

		// 昼または夕方の場合は雲を描画
		if (cycle < 0.75) {
			const cloudCount = 5;
			const cloudAlpha = cycle < 0.5 ? 0.2 : 0.3;

			for (let i = 0; i < cloudCount; i++) {
				const x =
					((this.simulation.time * 0.01 + i * 567.89) % (this.width + 200)) -
					100;
				const y = (Math.sin(i * 123.45) * 0.3 + 0.3) * this.height;
				const size = (Math.sin(i * 789.12) * 0.5 + 0.5) * 50 + 30;

				// 雲の形状（複数の円の組み合わせ）
				for (let j = 0; j < 5; j++) {
					const offsetX = (j - 2) * size * 0.3;
					const offsetY = Math.sin(j * 1.5) * size * 0.1;
					const radius = size * (0.7 + Math.sin(j * 2.5) * 0.3);

					this.ctx.beginPath();
					this.ctx.arc(x + offsetX, y + offsetY, radius, 0, Math.PI * 2);
					this.ctx.fillStyle = `rgba(255, 255, 255, ${cloudAlpha})`;
					this.ctx.fill();
				}
			}
		}
	}

	// 個体の描画
	drawEntities() {
		for (const entity of this.simulation.entities) {
			if (entity.isDead) continue;

			// 個体の色とグロー効果
			const color = entity.color;
			const colorStr = `rgb(${color.r}, ${color.g}, ${color.b})`;
			const glowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`;

			// グロー効果の描画
			const gradient = this.ctx.createRadialGradient(
				entity.x,
				entity.y,
				entity.size * 0.5,
				entity.x,
				entity.y,
				entity.size * 2,
			);
			gradient.addColorStop(0, glowColor);
			gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
			this.ctx.beginPath();
			this.ctx.arc(entity.x, entity.y, entity.size * 2, 0, Math.PI * 2);
			this.ctx.fillStyle = gradient;
			this.ctx.fill();

			// 基本形状の描画（グラデーション）
			const bodyGradient = this.ctx.createRadialGradient(
				entity.x - entity.size * 0.3,
				entity.y - entity.size * 0.3,
				0,
				entity.x,
				entity.y,
				entity.size,
			);
			bodyGradient.addColorStop(
				0,
				`rgb(${Math.min(255, color.r + 50)}, ${Math.min(255, color.g + 50)}, ${Math.min(255, color.b + 50)})`,
			);
			bodyGradient.addColorStop(1, colorStr);

			this.ctx.beginPath();
			this.ctx.arc(entity.x, entity.y, entity.size, 0, Math.PI * 2);
			this.ctx.fillStyle = bodyGradient;
			this.ctx.fill();

			// 選択された個体の強調表示
			if (entity === this.selectedEntity) {
				this.ctx.strokeStyle = "white";
				this.ctx.lineWidth = 2;
				this.ctx.stroke();
			}

			// 性別の表示（小さなマーク）
			this.ctx.beginPath();
			if (entity.gender === 0) {
				// 女性
				this.ctx.arc(entity.x, entity.y - entity.size - 3, 2, 0, Math.PI * 2);
			} else {
				// 男性
				this.ctx.moveTo(entity.x - 2, entity.y - entity.size - 5);
				this.ctx.lineTo(entity.x + 2, entity.y - entity.size - 1);
				this.ctx.moveTo(entity.x + 2, entity.y - entity.size - 5);
				this.ctx.lineTo(entity.x - 2, entity.y - entity.size - 1);
			}
			this.ctx.strokeStyle = colorStr;
			this.ctx.lineWidth = 1;
			this.ctx.stroke();

			// ライフステージの表示（輪郭の違い）
			if (entity.lifeStage === 0) {
				// 幼年期
				this.ctx.setLineDash([1, 1]);
				this.ctx.strokeStyle = colorStr;
				this.ctx.lineWidth = 1;
				this.ctx.stroke();
				this.ctx.setLineDash([]);
			} else if (entity.lifeStage === 2) {
				// 老年期
				this.ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
				this.ctx.lineWidth = 1;
				this.ctx.stroke();
			}

			// 名前と年齢の表示（ファーストネームのみ）
			this.ctx.font = "10px Arial";
			this.ctx.textAlign = "center";
			// 背景色に基づいて文字色を動的に設定
			this.ctx.fillStyle = this.calculateTextColor(
				this.currentBgColor.r,
				this.currentBgColor.g,
				this.currentBgColor.b,
			);
			this.ctx.fillText(
				`${entity.name.firstName} (${Math.floor(entity.age)})`,
				entity.x,
				entity.y - entity.size - 10,
			);
		}
	}

	// 関係性の描画
	drawRelationships() {
		// パートナー関係の描画（結婚関係）
		for (const entity of this.simulation.entities) {
			if (entity.isDead || !entity.partner || entity.partner.isDead) continue;

			// 各個体は1回だけ関係線を描画（重複を避ける）
			if (entity.id < entity.partner.id) {
				// 関係の強さを計算（0-1の範囲）
				const relationshipDuration =
					this.simulation.time - entity.partnershipStartTime;
				const strength = Math.min(relationshipDuration / 10, 1);

				// ベースの線を描画
				this.ctx.beginPath();
				this.ctx.moveTo(entity.x, entity.y);
				this.ctx.lineTo(entity.partner.x, entity.partner.y);
				this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.2 + strength * 0.3})`;
				this.ctx.lineWidth = 2;
				this.ctx.stroke();

				// 関係のキーを生成
				const relationKey = `${entity.id}_${entity.partner.id}`;

				// この関係のパーティクルを取得または初期化
				if (!this.particleMap.has(relationKey)) {
					this.particleMap.set(relationKey, []);
				}
				const particles = this.particleMap.get(relationKey);

				// パーティクルの生成
				const particleCount = 5 + Math.floor(strength * 15); // 関係が強いほど多く
				while (particles.length < particleCount) {
					particles.push({
						x: entity.x + (entity.partner.x - entity.x) * Math.random(),
						y: entity.y + (entity.partner.y - entity.y) * Math.random(),
						vx: (Math.random() - 0.5) * 2,
						vy: (Math.random() - 0.5) * 2,
						life: 1.0,
						decay: 0.02 + Math.random() * 0.02,
						size: 1 + strength * 2,
						alpha: 0.3 + strength * 0.5,
						hue: 45 + strength * 15, // 黄金色から赤金色へ
					});
				}

				// パーティクルの更新と描画
				for (let i = particles.length - 1; i >= 0; i--) {
					const p = particles[i];

					// パーティクルの位置を更新
					p.x += p.vx;
					p.y += p.vy;

					// 線の方向に引き寄せる力を適用
					const dx = entity.partner.x - entity.x;
					const dy = entity.partner.y - entity.y;
					const len = Math.sqrt(dx * dx + dy * dy);
					const dirX = dx / len;
					const dirY = dy / len;

					p.vx += dirX * 0.1;
					p.vy += dirY * 0.1;

					// 速度を制限
					const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
					if (speed > 2) {
						p.vx = (p.vx / speed) * 2;
						p.vy = (p.vy / speed) * 2;
					}

					// ライフタイムを減少
					p.life -= p.decay;

					// パーティクルの描画
					if (p.life > 0) {
						const gradient = this.ctx.createRadialGradient(
							p.x,
							p.y,
							0,
							p.x,
							p.y,
							p.size,
						);
						gradient.addColorStop(
							0,
							`hsla(${p.hue}, 80%, 50%, ${p.alpha * p.life})`,
						);
						gradient.addColorStop(1, `hsla(${p.hue}, 80%, 50%, 0)`);

						this.ctx.beginPath();
						this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
						this.ctx.fillStyle = gradient;
						this.ctx.fill();
					} else {
						// 寿命が尽きたパーティクルを削除
						particles.splice(i, 1);
					}
				}

				// パーティクル数が0になったら関係を削除
				if (particles.length === 0) {
					this.particleMap.delete(relationKey);
				}
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
					// 恋愛関係の線（点線アニメーション）
					this.ctx.beginPath();
					this.ctx.moveTo(entity.x, entity.y);
					this.ctx.lineTo(interest.x, interest.y);

					// 点線のパターンを時間とともに移動
					const dashOffset = -this.simulation.time * 0.1;
					this.ctx.setLineDash([5, 5]);
					this.ctx.lineDashOffset = dashOffset;

					// グロー効果（ピンク）
					this.ctx.strokeStyle = "rgba(255, 20, 147, 0.2)";
					this.ctx.lineWidth = 3;
					this.ctx.stroke();

					// メインの線（より鮮やかなピンク）
					this.ctx.strokeStyle = "rgba(255, 20, 147, 0.8)";
					this.ctx.lineWidth = 0.5;
					this.ctx.stroke();

					// 点線設定をリセット
					this.ctx.setLineDash([]);
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
				this.ctx.strokeStyle = "rgba(150, 255, 150, 0.3)";
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
				this.ctx.strokeStyle = "rgba(150, 255, 150, 0.3)";
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
			if (event.type === "birth" && event.entities.length > 0) {
				const child = event.entities[0];
				if (child.isDead) continue;

				// 出生イベント（輝き）
				this.ctx.beginPath();
				this.ctx.arc(child.x, child.y, child.size + 5, 0, Math.PI * 2);
				this.ctx.fillStyle = `rgba(255, 255, 150, ${alpha * 0.5})`;
				this.ctx.fill();
			} else if (event.type === "relationship" && event.entities.length >= 2) {
				const entity1 = event.entities[0];
				const entity2 = event.entities[1];
				if (entity1.isDead || entity2.isDead) continue;

				// 関係形成イベント（ハート）
				const centerX = (entity1.x + entity2.x) / 2;
				const centerY = (entity1.y + entity2.y) / 2;

				this.ctx.fillStyle = `rgba(255, 150, 150, ${alpha})`;
				this.drawHeart(centerX, centerY, 5);
			} else if (event.type === "death" && event.entities.length > 0) {
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
			x - size,
			y - size,
			x - size,
			y + size / 3,
			x,
			y + size,
		);

		// 右側の曲線
		this.ctx.bezierCurveTo(
			x + size,
			y + size / 3,
			x + size,
			y - size,
			x,
			y - size / 2,
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
			this.infoPanel.style.display = "block";

			// 背景色に基づいて情報パネルのスタイルを設定
			const textColor = this.calculateTextColor(
				this.currentBgColor.r,
				this.currentBgColor.g,
				this.currentBgColor.b,
			);
			const bgColor = `rgba(${this.currentBgColor.r}, ${this.currentBgColor.g}, ${this.currentBgColor.b}, 0.8)`;

			this.infoPanel.style.backgroundColor = bgColor;
			this.infoPanel.style.color = textColor;
			this.infoPanel.style.border = `1px solid ${textColor}`;

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
			this.infoPanel.style.display = "none";
		}
	}

	// 統計情報の更新
	updateStats() {
		const stats = this.simulation.statistics;
		const timeDisplay = Math.floor(this.simulation.time / 2); // 年齢の更新（2単位時間ごと）に合わせて調整

		// 背景色に基づいて文字色を設定
		const textColor = this.calculateTextColor(
			this.currentBgColor.r,
			this.currentBgColor.g,
			this.currentBgColor.b,
		);
		this.statsElement.style.color = textColor;
		this.statsElement.textContent = `個体数: ${stats.population} | 時間: ${timeDisplay}`;
	}

	// 昼夜表示の更新
	updateDayNightIndicator() {
		const cycle = this.simulation.dayNightCycle;
		let timeOfDay;

		if (cycle < 0.25) {
			timeOfDay = "朝";
		} else if (cycle < 0.5) {
			timeOfDay = "昼";
		} else if (cycle < 0.75) {
			timeOfDay = "夕方";
		} else {
			timeOfDay = "夜";
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
		this.infoPanel.style.display = "none";
	}
}
