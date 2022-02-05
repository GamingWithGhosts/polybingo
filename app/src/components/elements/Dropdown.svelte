<!--
  (c) 2022 Gaming With Ghosts
  This code is licensed under MIT license (see LICENSE for details)
-->

<style>
	.select-box {
		position: relative;
		display: block;
		width: 250px;
		font-family: 'Open Sans', 'Helvetica Neue', 'Segoe UI', 'Calibri', 'Arial', sans-serif;
		font-size: 36px;
		font-weight: bold;
		color: #60666d;
	}

	.select-box__current {
		position: relative;
		box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		outline: none;
	}

	.select-box__current:focus + .select-box__list {
		opacity: 1;
		-webkit-animation-name: none;
		animation-name: none;
	}

	.select-box__current:focus + .select-box__list .select-box__option {
		cursor: pointer;
	}

	.select-box__current:focus .select-box__icon {
		transform: translateY(-50%) rotate(180deg);
	}

	.select-box__icon {
		position: absolute;
		top: 50%;
		right: 15px;
		transform: translateY(-50%);
		width: 20px;
		opacity: 0.3;
		transition: 0.2s ease;
	}
	.select-box__value {
		display: flex;
	}
	.select-box__value p {
		border-radius: 22px;
	}
	.select-box__input {
		display: none;
	}

	.select-box__input:checked + .select-box__input-text {
		display: block;
	}

	.select-box__input-text {
		display: none;
		width: 100%;
		margin: 0;
		padding: 15px;
		background-color: #fff;
	}

	.select-box__list {
		position: absolute;
		width: 100%;
		padding: 0;
		list-style: none;
		opacity: 0;
		animation-name: HideList;
		animation-duration: 0.5s;
		animation-delay: 0.5s;
		animation-fill-mode: forwards;
		animation-timing-function: step-start;
		box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.1);
	}
	.select-box__option {
		display: block;
		padding: 15px;
		background-color: #fff;
	}
	.select-box__option:hover,
	.select-box__option:focus {
		color: #546c84;
		background-color: #fbfbfb;
	}

	@-webkit-keyframes HideList {
		from {
			transform: scaleY(1);
		}
		to {
			transform: scaleY(0);
		}
	}

	@keyframes HideList {
		from {
			transform: scaleY(1);
		}
		to {
			transform: scaleY(0);
		}
	}
</style>

<div class="select-box">
	<div class="select-box__current" tabindex="1">
		<div class="select-box__value">
			<input
					class="select-box__input"
					type="radio"
					id="0"
					value="1"
					name="game"
					checked="checked"
			/>
			<p class="select-box__input-text">Game 123</p>
		</div>
		<div class="select-box__value">
			<input class="select-box__input" type="radio" id="1" value="2" name="game" />
			<p class="select-box__input-text">Game 234</p>
		</div>
		<div class="select-box__value">
			<input class="select-box__input" type="radio" id="2" value="3" name="game" />
			<p class="select-box__input-text">Game 345</p>
		</div>
		<img
				class="select-box__icon"
				src="https://cdn.onlinewebfonts.com/svg/img_295694.svg"
				alt="Arrow Icon"
				aria-hidden="true"
		/>
	</div>
	<ul class="select-box__list">
		<li>
			<label class="select-box__option" for="0">Game 123</label>
		</li>
		<li>
			<label class="select-box__option" for="1">Game 234</label>
		</li>
		<li>
			<label class="select-box__option" for="2">Game 345</label>
		</li>
	</ul>
</div>
