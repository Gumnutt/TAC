<?php

declare(strict_types=1);

namespace Drupal\tac_breadcrumbs\Form;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\TypedConfigManagerInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Configures the menu and separator used by the TAC Breadcrumbs block.
 */
final class TacBreadcrumbsSettingsForm extends ConfigFormBase {

  private const SETTINGS = 'tac_breadcrumbs.settings';

  public function __construct(
    ConfigFactoryInterface $config_factory,
    TypedConfigManagerInterface $typedConfigManager,
    private readonly EntityTypeManagerInterface $entityTypeManager,
  ) {
    parent::__construct($config_factory, $typedConfigManager);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): static {
    return new static(
      $container->get('config.factory'),
      $container->get('config.typed'),
      $container->get('entity_type.manager'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'tac_breadcrumbs_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames(): array {
    return [self::SETTINGS];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {
    $config = $this->config(self::SETTINGS);

    $menus = $this->entityTypeManager->getStorage('menu')->loadMultiple();
    $options = array_map(static fn ($menu) => $menu->label(), $menus);
    asort($options);

    $form['menu'] = [
      '#type' => 'select',
      '#title' => $this->t('Menu'),
      '#description' => $this->t('The menu whose active trail is used to build the breadcrumb.'),
      '#options' => $options,
      '#default_value' => $config->get('menu'),
      '#required' => TRUE,
    ];
    $form['separator'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Separator'),
      '#default_value' => $config->get('separator'),
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state): void {
    $this->config(self::SETTINGS)
      ->set('menu', $form_state->getValue('menu'))
      ->set('separator', $form_state->getValue('separator'))
      ->save();

    parent::submitForm($form, $form_state);
  }

}
