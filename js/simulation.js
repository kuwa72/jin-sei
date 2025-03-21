// simulation.js - シミュレーションのメインロジック

class Simulation {
	constructor(width, height) {
		this.width = width;
		this.height = height;
		this.entities = [];
		this.events = [];
		this.relationshipSystem = new RelationshipSystem(this);
		this.nameGenerator = new NameGenerator(); // 名前生成器の初期化
		this.logger = new Logger(); // ライフログ管理の初期化
		this.time = 0;
		this.dayNightCycle = 0; // 0-1の範囲（0: 昼、0.5: 夕方、1: 夜）
		this.dayLength = 100; // 1日の長さを年齢の更新間隔（2単位時間）に合わせる
		this.paused = false;
		this.speed = 1;
		this.nextEntityId = 0;
		this.statistics = {
			population: 0,
			births: 0,
			deaths: 0,
			relationships: 0,
			averageAge: 0,
		};
	}

	// シミュレーションの初期化
	initialize(initialPopulation) {
		this.entities = [];
		this.events = [];
		this.time = 0;
		this.dayNightCycle = 0;
		this.statistics = {
			population: 0,
			births: 0,
			deaths: 0,
			relationships: 0,
			averageAge: 0,
		};

		// 初期個体の生成
		// 寿命はランダムに決める
		// 生成時に寿命が年齢を超えていたら死亡させる
		for (let i = 0; i < initialPopulation * 2; i++) {
			const x = Math.random() * this.width;
			const y = Math.random() * this.height;
			const gender = Math.random() < 0.5 ? 0 : 1;

			// 初期個体をランダムに生成
			const entity = this.createEntity(x, y, gender);
			entity.age = Math.floor(Math.random() * 80); // ランダムな年齢
			entity.lifeStage = 1; // 成年期
			entity.size = entity.calculateSize();
			entity.color = entity.calculateColor();

			// 寿命が年齢を超えていたら死亡させる
			if (entity.age >= entity.lifespan) {
				entity.die();
			}
		}

		this.updateStatistics();
	}

	// 新しい個体の作成
	createEntity(x, y, gender) {
		const entity = new Entity(this.nextEntityId++, x, y, gender, this);
		this.entities.push(entity);
		return entity;
	}

	// イベントの追加
	addEvent(event) {
		event.time = this.time;
		this.events.push(event);

		// イベント数の制限（最新の20件のみ保持）
		if (this.events.length > 20) {
			this.events.shift();
		}

		// イベントタイプに応じた統計更新とログ記録
		if (event.type === "birth" && event.entities.length >= 3) {
			const child = event.entities[0];
			const parent1 = event.entities[1];
			const parent2 = event.entities[2];
			this.statistics.births++;
			this.logger.logBirth(child, parent1, parent2);
		} else if (event.type === "death" && event.entities.length > 0) {
			const entity = event.entities[0];
			this.statistics.deaths++;
			this.logger.logDeath(entity);
		} else if (event.type === "relationship" && event.entities.length >= 2) {
			const entity1 = event.entities[0];
			const entity2 = event.entities[1];
			this.statistics.relationships++;
			this.logger.logMarriage(entity1, entity2);
		} else if (
			event.type === "relationship_end" &&
			event.entities.length >= 2
		) {
			const entity1 = event.entities[0];
			const entity2 = event.entities[1];
			this.logger.logDivorce(entity1, entity2);
		}
	}

	// 統計情報の更新
	updateStatistics() {
		const livingEntities = this.entities.filter((e) => !e.isDead);
		this.statistics.population = livingEntities.length;

		if (livingEntities.length > 0) {
			const totalAge = livingEntities.reduce((sum, e) => sum + e.age, 0);
			this.statistics.averageAge = totalAge / livingEntities.length;
		} else {
			this.statistics.averageAge = 0;
		}
	}

	// シミュレーションの更新
	update(deltaTime) {
		if (this.paused) return;

		// 速度に応じた時間の進行
		const actualDelta = deltaTime * this.speed;
		this.time += actualDelta;

		// 昼夜サイクルの更新
		this.dayNightCycle = (this.time % this.dayLength) / this.dayLength;

		// 時間経過のログを記録
		this.logger.logTimePassage(this.time);

		// 関係性システムの更新
		this.relationshipSystem.updateRelationships(actualDelta);

		// 個体の更新
		for (const entity of this.entities) {
			entity.update();
		}

		// 年齢の更新（2単位時間ごと）
		// より自然な時間の流れのために更新間隔を調整
		if (Math.floor(this.time / 2) > Math.floor((this.time - actualDelta) / 2)) {
			for (const entity of this.entities) {
				if (!entity.isDead) {
					entity.updateAge();
				}
			}

			// 死亡した個体の処理
			this.cleanupDeadEntities();

			// 統計情報の更新
			this.updateStatistics();

			// 個体数の制限（パフォーマンス対策）
			this.limitPopulation();
		}
	}

	// 死亡した個体の処理
	cleanupDeadEntities() {
		// 死亡した個体を配列から削除するのではなく、
		// isDead フラグで管理して描画時にスキップする
		// これにより、ID参照の整合性を保つ
	}

	/*
    // 個体数の制限
    limitPopulation() {
        const maxPopulation = 200; // 最大個体数
        const livingEntities = this.entities.filter(e => !e.isDead);
        
        if (livingEntities.length > maxPopulation) {
            // 最も古い個体から死亡させる
            livingEntities.sort((a, b) => b.age - a.age);
            
            const excessCount = livingEntities.length - maxPopulation;
            for (let i = 0; i < excessCount; i++) {
                if (i < livingEntities.length) {
                    livingEntities[i].die();
                }
            }
        }
    }
    */
	// 個体数の制限と淘汰圧の実装
	limitPopulation() {
		const criticalPopulation = 70; // 危機的な最小個体数
		const minPopulation = 100; // 通常の最小個体数
		const basePopulation = 150; // 基本的な最大個体数
		const maxPopulation = 200; // 絶対的な最大個体数
		const livingEntities = this.entities.filter((e) => !e.isDead);
		const currentPopulation = livingEntities.length;

		// 個体数が危機的な最小値を下回る場合、緊急フラグを設定
		this.isPopulationCritical = currentPopulation < criticalPopulation;

		// 基本的な最大数を超えた場合、淘汰圧を適用
		if (currentPopulation > basePopulation) {
			// 淘汰圧の計算（シグモイド関数で急激な増加を実現）
			const normalizedPopulation =
				(currentPopulation - basePopulation) / (maxPopulation - basePopulation);
			const pressureFactor =
				1 / (1 + Math.exp(-10 * (normalizedPopulation - 0.5)));

			// 各個体の評価関数
			for (const entity of livingEntities) {
				// 年齢による基本スコア（シグモイド関数で中年期に低く、高齢期に急上昇）
				const normalizedAge = entity.age / entity.lifespan;
				const ageScore = 1 / (1 + Math.exp(-12 * (normalizedAge - 0.7)));

				// 適応度スコア（協調性と外向性を考慮）
				const adaptabilityScore =
					(1 - entity.agreeableness) * 0.6 + (1 - entity.extroversion) * 0.4;

				// 総合評価（年齢の影響を抑え、適応度の影響を強める）
				entity.selectionScore = ageScore * 0.3 + adaptabilityScore * 0.7;

				// 淘汰圧に基づく死亡確率の計算（より急激な上昇）
				const deathProbability = entity.selectionScore * pressureFactor * 1.2;

				// 確率に基づいて死亡判定
				if (Math.random() < deathProbability) {
					entity.die();
				}
			}

			// それでも最大個体数を超える場合は強制的に削減
			const remainingLiving = livingEntities.filter((e) => !e.isDead);
			if (remainingLiving.length > maxPopulation) {
				remainingLiving.sort((a, b) => b.selectionScore - a.selectionScore);
				const excessCount = remainingLiving.length - maxPopulation;
				for (let i = 0; i < excessCount; i++) {
					if (i < remainingLiving.length) {
						remainingLiving[i].die();
					}
				}
			}
		}
	}

	// 個体の検索（座標から最も近い個体を取得）
	findEntityAt(x, y) {
		let closestEntity = null;
		let closestDistance = Number.POSITIVE_INFINITY;

		for (const entity of this.entities) {
			if (entity.isDead) continue;

			const dx = entity.x - x;
			const dy = entity.y - y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < closestDistance && distance < entity.size + 5) {
				closestEntity = entity;
				closestDistance = distance;
			}
		}

		return closestEntity;
	}

	// シミュレーションの一時停止/再開
	togglePause() {
		this.paused = !this.paused;
		return this.paused;
	}

	// シミュレーション速度の設定
	setSpeed(speed) {
		this.speed = speed;
	}

	// シミュレーションのリセット
	reset() {
		this.initialize(100); // 初期個体数を起動時と同じ100に統一
	}
}
