// entity.js - 生物エンティティの定義

class Entity {
	constructor(id, x, y, gender, simulation) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.gender = gender; // 0: 女性, 1: 男性
		this.simulation = simulation;

		// 名前の生成
		this.name = this.simulation.nameGenerator.generateName(gender);

		// 年齢関連
		this.age = 0;
		this.lifeStage = 0; // 0: 幼年期, 1: 成年期, 2: 老年期
		this.lifespan = this.calculateLifespan();

		// 性格特性 (0-1の範囲)
		this.extroversion = Math.random(); // 外向性
		this.agreeableness = Math.random(); // 協調性

		// 移動関連
		this.speed = 0.5 + Math.random() * 0.5;
		this.direction = Math.random() * Math.PI * 2;
		this.targetX = null;
		this.targetY = null;
		this.restCounter = 0;

		// 関係性
		this.relationships = []; // 他の個体との関係
		this.partner = null; // 結婚相手
		this.partnershipStartTime = 0; // 結婚開始時間
		this.parents = []; // 親
		this.children = []; // 子
		this.romanticInterests = []; // 恋愛対象（ユーザー要望による追加）

		// 状態
		this.isDead = false;
		this.isResting = false;

		// 視覚表現
		this.size = this.calculateSize();
		this.color = this.calculateColor();
	}

	// 寿命の計算 (20-80の範囲)
	calculateLifespan() {
		// 危機的状況では若い個体（15-30歳）の寿命を延ばす
		if (
			this.simulation.isPopulationCritical &&
			this.age >= 15 &&
			this.age <= 30
		) {
			// 最低50年の寿命を保証
			return Math.floor(Math.random() * 30 + 50);
		}

		// 通常時の寿命計算
		// 1%の確率で10年
		// 3%の確率で20年
		// 5%の確率で30年
		// 10%の確率で40年
		// 20%の確率で50年
		// else 60年
		if (Math.random() < 0.01) return Math.floor(Math.random() * 10 + 20);
		if (Math.random() < 0.02) return Math.floor(Math.random() * 20 + 20);
		if (Math.random() < 0.03) return Math.floor(Math.random() * 30 + 20);
		if (Math.random() < 0.1) return Math.floor(Math.random() * 40 + 20);
		if (Math.random() < 0.2) return Math.floor(Math.random() * 50 + 20);
		return Math.floor(Math.random() * 60 + 20);
	}

	// サイズの計算 (年齢に応じて変化)
	calculateSize() {
		if (this.lifeStage === 0) return 2; // 幼年期
		if (this.lifeStage === 1) return 6; // 成年期
		return 5; // 老年期
	}

	// 色の計算
	calculateColor() {
		const genderBase =
			this.gender === 0
				? { r: 255, g: 100, b: 150 }
				: // 女性: より鮮やかなピンク系
					{ r: 100, g: 150, b: 255 }; // 男性: より鮮やかな青系

		// 年齢による色の変化
		let ageFactor = 1.0;
		if (this.lifeStage === 0) {
			ageFactor = 1.2; // 幼年期は明るめ
		} else if (this.lifeStage === 2) {
			ageFactor = 0.8; // 老年期は暗め
		}

		// 関係状態による色の変化
		let relationFactor = 1.0;
		if (this.partner) {
			relationFactor = 1.1; // 結婚状態は少し明るく
		}

		return {
			r: Math.min(255, Math.floor(genderBase.r * ageFactor * relationFactor)),
			g: Math.min(255, Math.floor(genderBase.g * ageFactor * relationFactor)),
			b: Math.min(255, Math.floor(genderBase.b * ageFactor * relationFactor)),
		};
	}

	// 年齢の更新
	updateAge() {
		this.age += 1;

		// ライフステージの更新
		if (this.age >= 60) {
			this.lifeStage = 2; // 老年期
		} else if (this.age >= 15) {
			this.lifeStage = 1; // 成年期
		}

		// サイズと色の更新
		this.size = this.calculateSize();
		this.color = this.calculateColor();

		// 死亡判定
		if (this.age >= this.lifespan) {
			this.die();
		}
	}

	// 移動の更新
	updateMovement() {
		if (this.isDead) return;

		// 休息中なら動かない
		if (this.isResting) {
			this.restCounter--;
			if (this.restCounter <= 0) {
				this.isResting = false;
			}
			return;
		}

		// ランダムな休息
		if (Math.random() < 0.01) {
			this.isResting = true;
			this.restCounter = 20 + Math.floor(Math.random() * 30);
			return;
		}

		// パートナーが居るときはその地点から50px先を目標とする
		if (this.partner) {
			this.targetX = this.partner.x + 50 * Math.cos(this.partner.direction);
			this.targetY = this.partner.y + 50 * Math.sin(this.partner.direction);
		}

		// 目標がある場合はその方向に移動
		if (this.targetX !== null && this.targetY !== null) {
			const dx = this.targetX - this.x;
			const dy = this.targetY - this.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 5) {
				// 目標に到達したらリセット
				this.targetX = null;
				this.targetY = null;
			} else {
				// 目標に向かって移動
				this.direction = Math.atan2(dy, dx);
			}
		} else if (Math.random() < 0.05) {
			// ランダムに方向転換
			this.direction += ((Math.random() - 0.5) * Math.PI) / 2;
		}

		// 移動速度は性格と年齢に影響される
		let actualSpeed = this.speed;

		// 外向的な個体は速く動く
		actualSpeed *= 0.8 + this.extroversion * 0.4;

		// 年齢による速度変化
		if (this.lifeStage === 0) {
			actualSpeed *= 1.2; // 幼年期は活発
		} else if (this.lifeStage === 2) {
			actualSpeed *= 0.6; // 老年期は遅い
		}

		// 位置の更新
		this.x += Math.cos(this.direction) * actualSpeed;
		this.y += Math.sin(this.direction) * actualSpeed;

		// 画面の境界を超えないようにする
		const margin = 10;
		const width = this.simulation.width;
		const height = this.simulation.height;

		if (this.x < margin) {
			this.x = margin;
			this.direction = Math.PI - this.direction;
		} else if (this.x > width - margin) {
			this.x = width - margin;
			this.direction = Math.PI - this.direction;
		}

		if (this.y < margin) {
			this.y = margin;
			this.direction = -this.direction;
		} else if (this.y > height - margin) {
			this.y = height - margin;
			this.direction = -this.direction;
		}
	}

	// 他の個体との相互作用
	interact() {
		if (this.isDead || this.lifeStage !== 1) return; // 成年期のみ相互作用

		// パートナーがいる場合は繁殖の可能性をチェック
		if (this.partner && this.gender === 0) {
			// 女性のみが子を産む
			this.checkReproduction();
		}

		// パートナーがいない場合は新しい関係の可能性をチェック
		if (!this.partner) {
			this.checkNewRelationships();
		}
	}

	// 新しい関係の可能性をチェック
	checkNewRelationships() {
		const entities = this.simulation.entities;

		for (const other of entities) {
			// 自分自身、死亡している個体、異なるライフステージ、同性は除外
			if (
				other === this ||
				other.isDead ||
				other.lifeStage !== 1 ||
				other.gender === this.gender ||
				other.partner
			) {
				continue;
			}

			// 距離をチェック
			const dx = other.x - this.x;
			const dy = other.y - this.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 50) {
				// 近くにいる場合
				// 相性をチェック (性格特性の補完性)
				const compatibilityScore = this.calculateCompatibility(other);

				// 相性による関係形成判定
				let relationshipChance = 0.1; // 基本確率

				// 危機的状況では関係形成確率を上げる
				if (this.simulation.isPopulationCritical) {
					relationshipChance = 0.3; // 30%の確率で関係形成
					// 若い個体（15-30歳）同士はさらに確率上昇
					if (
						this.age >= 15 &&
						this.age <= 30 &&
						other.age >= 15 &&
						other.age <= 30
					) {
						relationshipChance = 0.5; // 50%の確率で関係形成
					}
				}

				// 相性が良ければ関係を形成
				if (compatibilityScore > 0.7 && Math.random() < relationshipChance) {
					this.formRelationship(other);
					break;
				}
			}
		}
	}

	// 相性の計算
	calculateCompatibility(other) {
		// 外向性の補完性 (差が小さいほど良い)
		const extroversionMatch =
			1 - Math.abs(this.extroversion - other.extroversion);

		// 協調性の補完性 (両方高いほど良い)
		const agreeablenessMatch = (this.agreeableness + other.agreeableness) / 2;

		// 総合的な相性スコア (0-1の範囲)
		return extroversionMatch * 0.5 + agreeablenessMatch * 0.5;
	}

	// 関係の形成
	formRelationship(other) {
		// お互いをパートナーとして設定し、開始時間を記録
		this.partner = other;
		this.partnershipStartTime = this.simulation.time;
		other.partner = this;
		other.partnershipStartTime = this.simulation.time;

		// 関係リストに追加
		this.relationships.push({
			entity: other,
			type: "partner",
			startTime: this.simulation.time,
		});
		other.relationships.push({
			entity: this,
			type: "partner",
			startTime: this.simulation.time,
		});

		// 視覚的な更新
		this.color = this.calculateColor();
		other.color = other.calculateColor();

		// 関係形成イベントを発生
		this.simulation.addEvent({
			type: "relationship",
			entities: [this, other],
		});
	}

	// 恋愛関係の追加（ユーザー要望による追加）
	addRomanticInterest(other) {
		// すでに恋愛対象リストにあるか確認
		if (!this.romanticInterests.includes(other)) {
			this.romanticInterests.push(other);

			// 一定時間後に恋愛関係を解消するタイマーを設定
			setTimeout(
				() => {
					this.removeRomanticInterest(other);
				},
				5000 + Math.random() * 5000,
			); // 5-10秒後に解消
		}
	}

	// 恋愛関係の解消（ユーザー要望による追加）
	removeRomanticInterest(other) {
		const index = this.romanticInterests.indexOf(other);
		if (index !== -1) {
			this.romanticInterests.splice(index, 1);
		}
	}

	// 繁殖のチェック
	checkReproduction() {
		const population = this.simulation.statistics.population;
		const criticalPopulation = 70; // 危機的な最小個体数
		const minPopulation = 100; // 通常の最小個体数
		const basePopulation = 150; // 基本的な最大個体数
		const maxPopulation = 200; // 絶対的な最大個体数

		// シミュレーション速度を取得
		const speed = this.simulation.speed;

		// 基準確率の計算（シグモイド関数で滑らかに変化）
		let baseRate;
		if (population < basePopulation) {
			// 人口が少ない場合（0.0002-0.002の範囲）
			const x = (basePopulation - population) / basePopulation;
			// より緩やかなカーブ（-6）と遅い立ち上がり（0.4）
			baseRate = (0.0002 + 0.0018 / (1 + Math.exp(-6 * (x - 0.4)))) * speed;
		} else {
			// 人口が多い場合（0.0002-0.001の範囲）
			const x =
				(population - basePopulation) / (maxPopulation - basePopulation);
			// より緩やかな減少（6）と遅い抑制（0.6）
			baseRate = (0.0002 + 0.0008 / (1 + Math.exp(6 * (x - 0.6)))) * speed;
		}

		let reproductionChance = baseRate;

		// 年齢による補正（より広い年齢範囲で繁殖可能に）
		const optimalAge = 27; // 最適年齢を中間に設定
		const ageDiff = Math.abs(this.age - optimalAge);
		const ageFactor = Math.exp(-(ageDiff * ageDiff) / 300); // より緩やかな減衰
		reproductionChance *= ageFactor * 2.5; // 年齢が最適な時は2.5倍

		// 子供の数による制限（より緩やかに）
		const maxChildren = population < criticalPopulation ? 6 : 4; // 制限を緩和
		const childFactor =
			1 / (1 + Math.exp(1.5 * (this.children.length - maxChildren))); // より緩やかな減少
		reproductionChance *= childFactor;

		// 危機的状況での追加ボーナス
		if (population <= criticalPopulation) {
			// 70体以下では、人口が少ないほどボーナスが大きい
			const criticalBonus =
				3 + ((criticalPopulation - population) / criticalPopulation) * 4;
			reproductionChance *= criticalBonus;

			// 若い個体（15-35歳）の繁殖をさらに促進
			if (this.age >= 15 && this.age <= 35) {
				reproductionChance *= 2.0; // ボーナスを増加
			}
		}

		if (Math.random() < reproductionChance) {
			this.reproduce();
		}
	}

	// 繁殖
	reproduce() {
		if (!this.partner || this.isDead || this.partner.isDead) return;

		// 新しい個体の性別をランダムに決定
		const childGender = Math.random() < 0.5 ? 0 : 1;

		// 子の位置は親の近くに設定
		const childX = this.x + (Math.random() - 0.5) * 20;
		const childY = this.y + (Math.random() - 0.5) * 20;

		// 新しい個体を作成
		const child = this.simulation.createEntity(childX, childY, childGender);

		// 親子関係の設定
		child.parents = [this, this.partner];
		this.children.push(child);
		this.partner.children.push(child);

		// 遺伝的特性の継承
		this.inheritTraits(child);

		// 出生イベントを発生
		this.simulation.addEvent({
			type: "birth",
			entities: [child, this, this.partner],
		});
	}

	// 特性の継承
	inheritTraits(child) {
		// 両親の特性の平均に若干のランダム変動を加える
		child.extroversion =
			(this.extroversion + this.partner.extroversion) / 2 +
			(Math.random() - 0.5) * 0.2;
		child.agreeableness =
			(this.agreeableness + this.partner.agreeableness) / 2 +
			(Math.random() - 0.5) * 0.2;

		// 0-1の範囲に収める
		child.extroversion = Math.max(0, Math.min(1, child.extroversion));
		child.agreeableness = Math.max(0, Math.min(1, child.agreeableness));

		// 寿命も若干継承される
		const parentAvgLifespan = (this.lifespan + this.partner.lifespan) / 2;
		child.lifespan = Math.floor(parentAvgLifespan + (Math.random() - 0.5) * 10);
		//child.lifespan = Math.max(60, Math.min(80, child.lifespan));
	}

	// 死亡処理
	die() {
		if (this.isDead) return;

		this.isDead = true;

		// パートナー関係の解消
		if (this.partner) {
			this.partner.partner = null;
			this.partner = null;
		}

		// 恋愛関係の解消
		this.romanticInterests = [];

		// 死亡イベントを発生
		this.simulation.addEvent({
			type: "death",
			entities: [this],
		});
	}

	// 情報パネル用のデータを取得
	getInfoData() {
		let lifeStageText = "";
		if (this.lifeStage === 0) lifeStageText = "幼年期";
		else if (this.lifeStage === 1) lifeStageText = "成年期";
		else lifeStageText = "老年期";

		let personalityText = "";
		if (this.extroversion > 0.7) personalityText += "外向的";
		else if (this.extroversion < 0.3) personalityText += "内向的";
		else personalityText += "中間的";

		if (this.agreeableness > 0.7) personalityText += "・協調的";
		else if (this.agreeableness < 0.3) personalityText += "・非協調的";
		else personalityText += "・中立的";

		let relationshipText = this.partner ? "結婚中" : "独身";
		if (this.romanticInterests.length > 0) {
			relationshipText += `（恋愛中: ${this.romanticInterests.length}人）`;
		}

		return {
			id: this.id,
			name: this.name.firstName,
			gender: this.gender === 0 ? "女性" : "男性",
			age: this.age,
			lifeStage: lifeStageText,
			personality: personalityText,
			relationship: relationshipText,
			children: this.children.length,
		};
	}

	// 更新処理
	update() {
		if (this.isDead) return;

		this.updateMovement();
		this.interact();
	}
}
