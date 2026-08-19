export const modalStyles = `
  .modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 1;
    transition: opacity 200ms ease-in-out;
  }

  .modalOverlay .modal {
    background: rgba(0,0,0,0.8);
    border-radius: 8px;
    border: 2px solid var(--text-primary-color);
    box-shadow: 0 2px 10px rgba(0,0,0,1);
    display: flex;
    flex-direction: column;
    position: relative;
    min-width: 400px;
    padding: 20px;
  }

  .modalOverlay .modalTitle {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .modalOverlay .modalTitleText {
    flex: 1;
    text-align: center;
    color: var(--text-primary-color);
    font-size: 16px;
    font-weight: bold;
    text-shadow: 1px 1px 1px black;
    padding-right: 30px;
  }

  .modalOverlay .modalCloseIcon {
    position: absolute;
    right: 10px;
    top: 10px;
    cursor: pointer;
    color: var(--text-primary-color);
    --mdc-icon-size: 40px;
    flex-shrink: 0;
  }

  .modalOverlay .overrideButtons {
    display: flex;
    margin-top: 40px;
    margin-bottom: 40px;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  .modalOverlay .socOverrideModal {
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .modalOverlay .socOverideInputOuter {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 20px;
    margin-bottom: 20px;
    gap: 6px;
  }

  .modalOverlay .socOverideInput {
    width: 54px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--text-primary-color);
    background: rgba(255,255,255,0.1);
    color: var(--text-primary-color);
  }

  .modalOverlay .overrideButtonOuter {
    display: flex;
    flexDirection: column;
    alignItems: center;
    justifyContent: center;
  }

  .modalOverlay .freezeIcon {
    position: absolute;
    bottom: 10px;
    right: 1px;
    cursor: pointer;
    pointer-events: none;
    --mdc-icon-size: 8px;
    opacity: 0.9;
  }

  .modalOverlay .overrideButtonIconWrapper {
    position: relative
  }

  .modalOverlay .overrideButtonIcon {
    pointer: cursor
  }

  .modalOverlay .socOverideSaveButton {
    padding: 10px 16px;
    border-radius: 6px;
    border: 1px solid var(--text-primary-color);
    background: var(--text-primary-color);
    color: var(--primary-background-color);
    font-weight: bold;
    cursor: pointer;
    align-self: center;
  }
`;