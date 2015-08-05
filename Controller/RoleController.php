<?php

/**
 * File containing the RoleController class.
 *
 * @copyright Copyright (C) eZ Systems AS. All rights reserved.
 * @license For full copyright and license information view LICENSE file distributed with this source code.
 */
namespace EzSystems\PlatformUIBundle\Controller;

use eZ\Bundle\EzPublishCoreBundle\Controller;
use eZ\Publish\API\Repository\Exceptions\InvalidArgumentException;
use eZ\Publish\API\Repository\Exceptions\LimitationValidationException;
use eZ\Publish\API\Repository\Exceptions\NotFoundException;
use eZ\Publish\API\Repository\Exceptions\UnauthorizedException;
use eZ\Publish\API\Repository\RoleService;
use eZ\Publish\Core\MVC\Symfony\Security\Authorization\Attribute;
use eZ\Publish\Core\Repository\Values\User\RoleCreateStruct;
use EzSystems\RepositoryForms\Data\Mapper\RoleMapper;
use EzSystems\RepositoryForms\Form\ActionDispatcher\ActionDispatcherInterface;
use Symfony\Component\HttpFoundation\Request;

class RoleController extends Controller
{
    /**
     * @var \eZ\Publish\API\Repository\RoleService
     */
    protected $roleService;

    /**
     * @var ActionDispatcherInterface
     */
    private $actionDispatcher;

    public function __construct(
        RoleService $roleService,
        ActionDispatcherInterface $actionDispatcher
    ) {
        $this->roleService = $roleService;
        $this->actionDispatcher = $actionDispatcher;
    }

    /**
     * Renders the role list.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function listRolesAction()
    {
        return $this->render('eZPlatformUIBundle:Role:list_roles.html.twig', [
            'roles' => $this->roleService->loadRoles(),
            'can_edit' => $this->isGranted(new Attribute('role', 'update')),
            'can_create' => $this->isGranted(new Attribute('role', 'create')),
            'can_delete' => $this->isGranted(new Attribute('role', 'delete')),
        ]);
    }

    /**
     * Renders a role.
     *
     * @param int $roleId Role ID
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function viewRoleAction($roleId)
    {
        $role = $this->roleService->loadRole($roleId);
        $roleAssignments = $this->roleService->getRoleAssignments($role);

        return $this->render('eZPlatformUIBundle:Role:view_role.html.twig', [
            'role' => $role,
            'role_assignments' => $roleAssignments,
            'can_edit' => $this->isGranted(new Attribute('role', 'update')),
            'can_delete' => $this->isGranted(new Attribute('role', 'delete')),
        ]);
    }

    /**
     * Creates a role.
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function createRoleAction()
    {
        try {
            $roleCreateStruct = new RoleCreateStruct([
                'identifier' => '__new__' . md5(microtime(true)),
            ]);
            $role = $this->roleService->createRole($roleCreateStruct);
        } catch (UnauthorizedException $e) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied');
        } catch (InvalidArgumentException $e) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied'); // TODO: is this correct? Name is already existing, or limitation errors
        } catch (LimitationValidationException $e) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied'); // TODO: is this correct? Invalid policy limitation.
        }

        return $this->redirectToRoute(
            'admin_roleUpdate',
            ['roleId' => $role->id]
        );
    }

    /**
     * Updates a role.
     *
     * @param int $roleId Role ID
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function updateRoleAction(Request $request, $roleId)
    {
        try {
            $role = $this->roleService->loadRole($roleId);
        } catch (NotFoundException $e) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied'); // TODO: is this correct?
        }

        $roleData = (new RoleMapper())->mapToFormData($role);
        $form = $this->createForm(
            'ezrepoforms_role_update',
            $roleData
        );
        $actionUrl = $this->generateUrl(
            'admin_roleUpdate',
            ['roleId' => $roleId]
        );

        // Synchronize form and data.
        $form->handleRequest($request);
        if ($form->isValid()) {
            try {
                $this->actionDispatcher->dispatchFormAction(
                    $form,
                    $roleData,
                    $form->getClickedButton()->getName()
                );
            } catch (InvalidArgumentException $e) {
                return $this->forward('eZPlatformUIBundle:Pjax:accessDenied'); // TODO: is this correct? Name is already existing.
            } catch (UnauthorizedException $e) {
                return $this->forward('eZPlatformUIBundle:Pjax:accessDenied');
            }

            if ($response = $this->actionDispatcher->getResponse()) {
                return $response;
            }

            return $this->redirect($actionUrl);
        }

        return $this->render('eZPlatformUIBundle:Role:update_role.html.twig', [
            'form' => $form->createView(),
            'action_url' => $actionUrl,
            'role' => $role,
        ]);
    }

    /**
     * Deletes a role.
     *
     * @param int $roleId Role ID
     *
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function deleteRoleAction($roleId)
    {
        try {
            $role = $this->roleService->loadRole($roleId);
        } catch (NotFoundException $e) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied'); // TODO: is this correct?
        }

        try {
            $this->roleService->deleterole($role);
        } catch (UnauthorizedException $e) {
            return $this->forward('eZPlatformUIBundle:Pjax:accessDenied');
        }

        return $this->redirect(
            $this->generateUrl('admin_roleList')
        );
    }
}
