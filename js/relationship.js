// relationship.js - 関係性の管理

class Relationship {
	constructor(entity1, entity2, type) {
		this.entity1 = entity1;
		this.entity2 = entity2;
		this.type = type; // 'partner', 'parent-child', 'romantic'
		this.startTime = 0;
		this.strength = 0.5; // 関係の強さ (0-1)
	}

	// 関係の強さを更新
	updateStrength(deltaTime) {
		// 時間経過で関係が強まる
		this.startTime += deltaTime;

		// 基本的な強化率（シミュレーション速度で調整）
		const speed = this.entity1.simulation.speed;
		let strengthIncrease = 0.001 * deltaTime * speed;

		// 性格特性による影響
		const compatibility = Genetics.calculateCompatibility(
			this.entity1,
			this.entity2,
		);
		strengthIncrease *= 0.5 + compatibility;

		// 関係の強さを更新
		this.strength = Math.min(1.0, this.strength + strengthIncrease);
	}

	// 関係が解消される可能性をチェック
	checkDissolve() {
		// パートナー関係のみ解消の可能性がある
		if (this.type !== "partner") return false;

		// 関係の強さに基づく解消確率（シミュレーション速度で調整）
		const speed = this.entity1.simulation.speed;
		const dissolveChance = 0.001 * (1 - this.strength) * speed;

		return Math.random() < dissolveChance;
	}

	// 関係を解消
	dissolve() {
		if (this.type === "partner") {
			// パートナー関係の解消
			this.entity1.partner = null;
			this.entity2.partner = null;

			// 関係リストから削除
			this.entity1.relationships = this.entity1.relationships.filter(
				(r) => r.entity !== this.entity2,
			);
			this.entity2.relationships = this.entity2.relationships.filter(
				(r) => r.entity !== this.entity1,
			);
		}
	}
}

// 関係性管理システム
class RelationshipSystem {
	constructor(simulation) {
		this.simulation = simulation;
		this.relationships = [];
		this.romanticRelationships = []; // 恋愛関係の追跡（ユーザー要望による追加）
	}

	// 関係を作成
	createRelationship(entity1, entity2, type) {
		const relationship = new Relationship(entity1, entity2, type);
		this.relationships.push(relationship);
		return relationship;
	}

	// 恋愛関係を作成（ユーザー要望による追加）
	createRomanticRelationship(entity1, entity2) {
		// すでに恋愛関係があるか確認
		const existingRelationship = this.romanticRelationships.find(
			(r) =>
				(r.entity1 === entity1 && r.entity2 === entity2) ||
				(r.entity1 === entity2 && r.entity2 === entity1),
		);

		if (!existingRelationship) {
			// 恋愛関係を追加
			const relationship = {
				entity1: entity1,
				entity2: entity2,
				startTime: this.simulation.time,
				duration: 50 + Math.random() * 100, // 50-150の範囲でランダムな持続時間
			};

			this.romanticRelationships.push(relationship);

			// 個体の恋愛対象リストに追加
			entity1.addRomanticInterest(entity2);
			entity2.addRomanticInterest(entity1);
		}
	}

	// 関係を更新
	updateRelationships(deltaTime) {
		// 既存の関係を更新
		for (let i = this.relationships.length - 1; i >= 0; i--) {
			const relationship = this.relationships[i];

			// 死亡した個体の関係は削除
			if (relationship.entity1.isDead || relationship.entity2.isDead) {
				this.relationships.splice(i, 1);
				continue;
			}

			// 関係の強さを更新
			relationship.updateStrength(deltaTime);

			// 関係の解消をチェック
			if (relationship.checkDissolve()) {
				relationship.dissolve();
				this.relationships.splice(i, 1);

				// 関係解消イベントを発生
				this.simulation.addEvent({
					type: "relationship_end",
					entities: [relationship.entity1, relationship.entity2],
				});
			}
		}

		// 恋愛関係の更新（ユーザー要望による追加）
		for (let i = this.romanticRelationships.length - 1; i >= 0; i--) {
			const romance = this.romanticRelationships[i];

			// 死亡した個体の関係は削除
			if (romance.entity1.isDead || romance.entity2.isDead) {
				// 恋愛対象リストから削除
				romance.entity1.removeRomanticInterest(romance.entity2);
				romance.entity2.removeRomanticInterest(romance.entity1);

				this.romanticRelationships.splice(i, 1);
				continue;
			}

			// 持続時間を超えた関係は解消
			if (this.simulation.time - romance.startTime > romance.duration) {
				// 恋愛対象リストから削除
				romance.entity1.removeRomanticInterest(romance.entity2);
				romance.entity2.removeRomanticInterest(romance.entity1);

				this.romanticRelationships.splice(i, 1);

				// 恋愛失敗イベントをログに記録（ログ出力はされないが内部処理として実行）
				this.simulation.logger.logRomanceFailed(
					romance.entity1,
					romance.entity2,
				);
			}
		}

		// 新しい関係の形成可能性をチェック
		this.checkNewRelationships();
	}

	// 新しい関係の形成可能性をチェック
	checkNewRelationships() {
		const entities = this.simulation.entities;

		// 成年期の個体のみが新しい関係を形成できる
		const adultEntities = entities.filter(
			(e) => !e.isDead && e.lifeStage === 1 && !e.partner,
		);

		// 関係形成の試行回数を制限（パフォーマンス対策）
		const maxAttempts = Math.min(5, adultEntities.length);

		for (let i = 0; i < maxAttempts; i++) {
			// ランダムに個体を選択
			const randomIndex = Math.floor(Math.random() * adultEntities.length);
			const entity = adultEntities[randomIndex];

			// すでにパートナーがいる場合はスキップ
			if (entity.partner) continue;

			// 潜在的なパートナーを探す
			this.findPotentialPartner(entity);
		}
	}

	// 潜在的なパートナーを探す
	findPotentialPartner(entity) {
		const entities = this.simulation.entities;
		const potentialPartners = [];

		for (const other of entities) {
			// 自分自身、死亡している個体、異なるライフステージ、同性、すでにパートナーがいる個体は除外
			if (
				other === entity ||
				other.isDead ||
				other.lifeStage !== 1 ||
				other.gender === entity.gender ||
				other.partner
			) {
				continue;
			}

			// 距離をチェック
			const dx = other.x - entity.x;
			const dy = other.y - entity.y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 50) {
				// 近くにいる場合
				// 恋愛関係を作成（ユーザー要望による追加）
				this.createRomanticRelationship(entity, other);

				// 恋愛イベントをログに記録（ログ出力はされないが内部処理として実行）
				this.simulation.logger.logRomance(entity, other);

				// 相性をチェック
				const compatibilityScore = Genetics.calculateCompatibility(
					entity,
					other,
				);

				// 相性が良ければ潜在的なパートナーとして追加
				if (compatibilityScore > 0.6) {
					potentialPartners.push({
						entity: other,
						compatibility: compatibilityScore,
						distance: distance,
					});
				} else {
					// 相性が悪ければ恋愛失敗をログに記録（ログ出力はされないが内部処理として実行）
					this.simulation.logger.logRomanceFailed(entity, other);
				}
			}
		}

		// 潜在的なパートナーがいれば、最も相性の良い相手と関係を形成
		if (potentialPartners.length > 0) {
			// 相性でソート
			potentialPartners.sort((a, b) => b.compatibility - a.compatibility);

			// 関係形成の確率（相性とシミュレーション速度に依存）
			const speed = this.simulation.speed;
			const formationChance = potentialPartners[0].compatibility * 0.2 * speed;

			if (Math.random() < formationChance) {
				const partner = potentialPartners[0].entity;
				this.formPartnership(entity, partner);
			}
		}
	}

	// パートナー関係を形成
	formPartnership(entity1, entity2) {
		// お互いをパートナーとして設定
		entity1.partner = entity2;
		entity2.partner = entity1;

		// 関係リストに追加
		entity1.relationships.push({ entity: entity2, type: "partner" });
		entity2.relationships.push({ entity: entity1, type: "partner" });

		// 関係オブジェクトを作成
		this.createRelationship(entity1, entity2, "partner");

		// 視覚的な更新
		entity1.color = entity1.calculateColor();
		entity2.color = entity2.calculateColor();

		// 関係形成イベントを発生
		this.simulation.addEvent({
			type: "relationship",
			entities: [entity1, entity2],
		});
	}
}
