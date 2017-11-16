import {
  addClass,
  getScrollbarWidth,
  getScrollLeft,
  getWindowScrollTop,
  hasClass,
  outerWidth,
  innerHeight,
  removeClass,
  setOverlayPosition,
  resetCssTransform
} from './../../../../helpers/dom/element';
import Overlay from './_base';

/**
 * @class LeftOverlay
 */
class LeftOverlay extends Overlay {
  /**
   * @param {Walkontable} wotInstance
   */
  constructor(wotInstance) {
    super(wotInstance);
    this.clone = this.makeClone(Overlay.CLONE_LEFT);
  }

  /**
   * Checks if overlay should be fully rendered
   *
   * @returns {Boolean}
   */
  shouldBeRendered() {
    return !!(this.wot.getSetting('fixedColumnsLeft') || this.wot.getSetting('rowHeaders').length);
  }

  /**
   * Updates the left overlay position
   */
  resetFixedPosition() {
    if (!this.needFullRender || !this.wot.wtTable.holder.parentNode) {
      this.clone.wtTable.wtRootElement.style.height = '0';
      // removed from DOM
      return;
    }

    this.clone.wtTable.wtRootElement.style.height = 'auto';

    this.adjustElementsSize();
  }

  /**
   * Sets the main overlay's horizontal scroll position
   *
   * @param {Number} pos
   */
  setScrollPosition(pos) {
    this.mainTableScrollableElement.scrollLeft = pos;
  }

  /**
   * Triggers onScroll hook callback
   */
  onScroll() {
    this.wot.getSetting('onScrollVertically');
  }

  /**
   * Calculates total sum cells width
   *
   * @param {Number} from Column index which calculates started from
   * @param {Number} to Column index where calculation is finished
   * @returns {Number} Width sum
   */
  sumCellSizes(from, to) {
    let sum = 0;
    let defaultColumnWidth = this.wot.wtSettings.defaultColumnWidth;

    while (from < to) {
      sum += this.wot.wtTable.getStretchedColumnWidth(from) || defaultColumnWidth;
      from++;
    }

    return sum;
  }

  /**
   * Adjust overlay root element, childs and master table element sizes (width, height).
   *
   * @param {Boolean} [force=false]
   */
  adjustElementsSize(force = false) {
    this.updateTrimmingContainer();

    if (this.needFullRender || force) {
      this.adjustRootElementSize();
      this.adjustRootChildrenSize();

      if (!force) {
        this.areElementSizesAdjusted = true;
      }
    }
  }

  /**
   * Adjust overlay root element size (width and height).
   */
  adjustRootElementSize() {
    let wtOverlays = this.wot.wtOverlays;
    let scrollbarHeight = this.wot.wtTable.wtRootElement.offsetWidth >= wtOverlays.scrollResizerX.offsetWidth ? 0 : getScrollbarWidth();
    let overlayRoot = this.clone.wtTable.holder.parentNode;
    let overlayRootStyle = overlayRoot.style;
    let preventOverflow = this.wot.getSetting('preventOverflow');
    let tableWidth;

    if (scrollbarHeight) {
      this.wot.wtTable.wtRootElement.parentNode.style.paddingBottom = `${scrollbarHeight}px`;
    }

    if (this.trimmingContainer !== window || preventOverflow === 'vertical') {
      let height = this.wot.wtViewport.getWorkspaceHeight() - scrollbarHeight;

      height = Math.min(height, innerHeight(this.wot.wtTable.wtRootElement));

      overlayRootStyle.height = `${height}px`;

    } else {
      overlayRootStyle.height = '';
    }

    tableWidth = outerWidth(this.clone.wtTable.TABLE);
    overlayRootStyle.width = `${tableWidth}px`;
  }

  /**
   * Adjust overlay root childs size
   */
  adjustRootChildrenSize() {
    this.clone.wtTable.hider.style.height = this.hider.style.height;
  }

  /**
   * Adjust the overlay dimensions and position
   */
  applyToDOM() {
    let total = this.wot.getSetting('totalColumns');

    if (!this.areElementSizesAdjusted) {
      this.adjustElementsSize();
    }
    if (typeof this.wot.wtViewport.columnsRenderCalculator.startPosition === 'number') {
      this.spreader.style.left = `${this.wot.wtViewport.columnsRenderCalculator.startPosition}px`;

    } else if (total === 0) {
      this.spreader.style.left = '0';

    } else {
      throw new Error('Incorrect value of the columnsRenderCalculator');
    }
    this.spreader.style.right = '';

    if (this.needFullRender) {
      this.syncOverlayOffset();
    }
  }

  /**
   * Synchronize calculated top position to an element
   */
  syncOverlayOffset() {
    if (typeof this.wot.wtViewport.rowsRenderCalculator.startPosition === 'number') {
      this.clone.wtTable.spreader.style.top = `${this.wot.wtViewport.rowsRenderCalculator.startPosition}px`;

    } else {
      this.clone.wtTable.spreader.style.top = '';
    }
  }

  /**
   * Scrolls horizontally to a column at the left edge of the viewport
   *
   * @param sourceCol {Number} Column index which you want to scroll to
   * @param [beyondRendered=false] {Boolean} if `true`, scrolls according to the bottom edge (top edge is by default)
   */
  scrollTo(sourceCol, beyondRendered) {
    let newX = this.getTableParentOffset();
    let sourceInstance = this.wot.cloneSource ? this.wot.cloneSource : this.wot;
    let wtOverlays = this.wot.wtOverlays;
    let scrollbarCompensation = beyondRendered ? 1 : 0;

    if (beyondRendered && wtOverlays.scrollableElement.offsetWidth !== wtOverlays.scrollResizerX.clientWidth) {
      // scrollbarCompensation = getScrollbarWidth();
    }
    if (beyondRendered) {
      newX += this.sumCellSizes(0, sourceCol + 1);
      newX -= this.wot.wtViewport.getViewportWidth();

    } else {
      newX += this.sumCellSizes(this.wot.getSetting('fixedColumnsLeft'), sourceCol);
    }
    newX += scrollbarCompensation;

    this.setScrollPosition(newX);
  }

  /**
   * Gets table parent left position
   *
   * @returns {Number}
   */
  getTableParentOffset() {
    let preventOverflow = this.wot.getSetting('preventOverflow');
    let offset = 0;

    if (!preventOverflow && this.trimmingContainer === window) {
      offset = this.wot.wtTable.holderOffset.left;
    }

    return offset;
  }

  /**
   * Gets the main overlay's horizontal scroll position
   *
   * @returns {Number} Main table's vertical scroll position
   */
  getScrollPosition() {
    var element = document.querySelector('.scroll-overlay');

    if (!element) {
      element = this.mainTableScrollableElement;
    }

    return getScrollLeft(element);
  }
}

Overlay.registerOverlay(Overlay.CLONE_LEFT, LeftOverlay);

export default LeftOverlay;
