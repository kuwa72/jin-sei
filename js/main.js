// main.js - アプリケーションのエントリーポイント

// グローバル変数
let simulation;
let renderer;
let lastTimestamp = 0;
let isTabActive = true;

// DOMが読み込まれた後に初期化
document.addEventListener("DOMContentLoaded", initialize);

// 初期化処理
function initialize() {
	// キャンバスの取得と設定
	const canvas = document.getElementById("simulation-canvas");
	const container = document.getElementById("simulation-container");

	// キャンバスサイズを画面サイズに合わせる
	function resizeCanvas() {
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		if (simulation) {
			simulation.width = canvas.width;
			simulation.height = canvas.height;
		}
	}

	// 初期サイズ設定
	resizeCanvas();

	// シミュレーションとレンダラーの初期化
	simulation = new Simulation(canvas.width, canvas.height);
	renderer = new Renderer(simulation, canvas);

	// シミュレーションの開始
	simulation.initialize(100); // 初期個体数100

	// ウィンドウリサイズ時のイベントリスナー
	window.addEventListener("resize", resizeCanvas);

	// イベントリスナーの設定
	setupEventListeners();

	// アニメーションループの開始
	requestAnimationFrame(animationLoop);

	// タブの可視性変更検出
	document.addEventListener("visibilitychange", handleVisibilityChange);
}

// イベントリスナーの設定
function setupEventListeners() {
	const canvas = document.getElementById("simulation-canvas");
	const playPauseButton = document.getElementById("play-pause");
	const speedSlider = document.getElementById("speed-slider");
	const resetButton = document.getElementById("reset");

	// キャンバスのクリックイベント（個体選択）
	canvas.addEventListener("click", (event) => {
		const rect = canvas.getBoundingClientRect();
		// キャンバスの実際のサイズとスタイル上のサイズの比率を考慮
		const scaleX = canvas.width / rect.width;
		const scaleY = canvas.height / rect.height;
		const x = (event.clientX - rect.left) * scaleX;
		const y = (event.clientY - rect.top) * scaleY;

		const selectedEntity = renderer.selectEntityAt(x, y);
		if (!selectedEntity) {
			renderer.clearSelection();
		}
	});

	// 再生/一時停止ボタン
	playPauseButton.addEventListener("click", () => {
		const isPaused = simulation.togglePause();
		playPauseButton.textContent = isPaused ? "再開" : "一時停止";
	});

	// 速度調整スライダー
	speedSlider.addEventListener("input", () => {
		const speed = Number.parseInt(speedSlider.value);
		simulation.setSpeed(speed);
	});

	// リセットボタン
	resetButton.addEventListener("click", () => {
		simulation.reset();
		renderer.clearSelection();
	});
}

// アニメーションループ
function animationLoop(timestamp) {
	// 前回のフレームからの経過時間を計算
	if (lastTimestamp === 0) {
		lastTimestamp = timestamp;
	}
	const deltaTime = (timestamp - lastTimestamp) / 1000; // 秒単位に変換
	lastTimestamp = timestamp;

	// タブがアクティブでない場合は更新頻度を下げる
	if (isTabActive || Math.random() < 0.1) {
		// 非アクティブ時は10%の確率でのみ更新
		// シミュレーションの更新
		simulation.update(deltaTime);

		// 描画
		renderer.render();
	}

	// 次のフレームをリクエスト
	requestAnimationFrame(animationLoop);
}

// タブの可視性変更ハンドラ
function handleVisibilityChange() {
	isTabActive = !document.hidden;

	// タブがアクティブになった時に最終タイムスタンプをリセット
	// これにより、非アクティブ中の大きな時間ジャンプを防ぐ
	if (isTabActive) {
		lastTimestamp = 0;
	}
}
